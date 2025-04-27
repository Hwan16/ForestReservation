/**
 * migrate-auth.js
 * 
 * 기존 SQLite 사용자를 Supabase Auth로 마이그레이션하는 스크립트입니다.
 * 이 스크립트는 모든 사용자를 Supabase Auth에 등록하고 
 * 필요한 경우 사용자 메타데이터를 함께 이전합니다.
 */

// 필요한 모듈 불러오기
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 환경 변수 설정
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: envFile });
console.log(`환경 변수 로드: ${envFile}`);

// 설정
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './database.sqlite';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 20; // Auth API 요청을 제한하기 위해 더 작은 배치 크기 사용

// 유효성 검사
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('오류: Supabase URL과 서비스 롤 키를 환경 변수에 설정해야 합니다.');
  process.exit(1);
}

// Supabase 클라이언트 초기화 (서비스 롤 키 사용)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 로깅 유틸리티
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
};

// 일시 정지 함수 (요청 제한 방지)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// SQLite 데이터베이스 열기
function openSqliteDb() {
  return new Promise((resolve, reject) => {
    logger.info(`SQLite 데이터베이스 열기: ${SQLITE_DB_PATH}`);
    
    // 데이터베이스 파일이 존재하는지 확인
    if (!fs.existsSync(SQLITE_DB_PATH)) {
      return reject(new Error(`SQLite 데이터베이스 파일을 찾을 수 없습니다: ${SQLITE_DB_PATH}`));
    }
    
    const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// 사용자 가져오기
async function fetchUsers(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Supabase Auth에 사용자 생성
async function createSupabaseUser(user, defaultPassword = null) {
  try {
    // 임시 비밀번호 생성 (사용자가 나중에 변경하도록 유도)
    const tempPassword = defaultPassword || 
                         `Temp${Math.random().toString(36).substring(2, 10)}!`;
    
    // Supabase Auth에 사용자 생성
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: tempPassword,
      email_confirm: true, // 이메일 확인 없이 즉시 계정 활성화
      user_metadata: {
        username: user.username,
        role: user.role || 'user'
      }
    });
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true, 
      userId: data.user.id, 
      tempPassword,
      user: data.user
    };
    
  } catch (error) {
    logger.error(`사용자 생성 실패 (${user.email}): ${error.message}`);
    return { 
      success: false, 
      email: user.email, 
      error: error.message 
    };
  }
}

// 사용자 메타데이터 업데이트
async function updateUserMetadata(userId, metadata) {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, user: data.user };
    
  } catch (error) {
    logger.error(`메타데이터 업데이트 실패 (${userId}): ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Supabase Auth에 이미 존재하는 사용자 확인
async function checkExistingUser(email) {
  try {
    // 관리자 API로 사용자 목록 조회 (이메일로 필터링)
    const { data, error } = await supabase.auth.admin.listUsers({
      filter: {
        email
      }
    });
    
    if (error) {
      throw error;
    }
    
    return data.users.length > 0 ? data.users[0] : null;
    
  } catch (error) {
    logger.error(`기존 사용자 확인 실패 (${email}): ${error.message}`);
    return null;
  }
}

// 사용자 마이그레이션
async function migrateUsers(db) {
  logger.info('사용자 Auth 마이그레이션 시작...');
  
  // 모든 사용자 가져오기
  const users = await fetchUsers(db);
  logger.info(`마이그레이션할 사용자 ${users.length}명 발견`);
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    users: []
  };
  
  // 기본 관리자 비밀번호 (나중에 변경하도록 안내)
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminTemp2023!';
  
  // 배치 처리
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    logger.info(`배치 처리 중 ${i+1}-${Math.min(i+BATCH_SIZE, users.length)}/${users.length}`);
    
    for (const user of batch) {
      // 이미 존재하는 사용자인지 확인
      const existingUser = await checkExistingUser(user.email);
      
      if (existingUser) {
        logger.warn(`사용자가 이미 존재함 (${user.email}), 메타데이터만 업데이트`);
        
        // 메타데이터 업데이트
        const updateResult = await updateUserMetadata(existingUser.id, {
          username: user.username,
          role: user.role || 'user'
        });
        
        if (updateResult.success) {
          results.success++;
          results.users.push({
            email: user.email,
            id: existingUser.id,
            status: 'updated'
          });
        } else {
          results.failed++;
        }
        
        continue;
      }
      
      // 관리자 사용자는 기본 관리자 비밀번호 사용
      const isAdmin = user.role === 'admin';
      const password = isAdmin ? defaultAdminPassword : null;
      
      // 새 사용자 생성
      const createResult = await createSupabaseUser(user, password);
      
      if (createResult.success) {
        results.success++;
        results.users.push({
          email: user.email,
          id: createResult.userId,
          tempPassword: createResult.tempPassword,
          status: 'created'
        });
        
        logger.success(`사용자 생성 성공: ${user.email}`);
      } else {
        results.failed++;
        logger.error(`사용자 생성 실패: ${user.email}`);
      }
      
      // 요청 제한 방지를 위한 짧은 대기
      await sleep(500);
    }
    
    // 배치 간 대기
    if (i + BATCH_SIZE < users.length) {
      logger.info('요청 제한 방지를 위해 대기 중...');
      await sleep(2000);
    }
  }
  
  logger.info(`사용자 Auth 마이그레이션 완료: ${results.success} 성공, ${results.failed} 실패, ${results.skipped} 건너뜀`);
  return results;
}

// 마이그레이션 결과 저장
function saveResults(results) {
  const resultFile = path.join(__dirname, 'auth-migration-results.json');
  fs.writeFileSync(resultFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...results
  }, null, 2));
  
  // 사용자 비밀번호 정보 저장 (보안을 위해 별도 파일로)
  const passwordsFile = path.join(__dirname, 'temp-passwords.json');
  fs.writeFileSync(passwordsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    message: '이 파일에는 민감한 정보가 포함되어 있습니다. 마이그레이션 후 삭제하세요.',
    users: results.users.map(u => ({
      email: u.email,
      tempPassword: u.tempPassword,
      status: u.status
    }))
  }, null, 2));
  
  logger.info(`마이그레이션 결과가 저장되었습니다: ${resultFile}`);
  logger.warn(`임시 비밀번호가 저장되었습니다: ${passwordsFile} (마이그레이션 후 이 파일을 삭제하세요!)`);
}

// 메인 함수
async function main() {
  let db;
  try {
    logger.info('SQLite 사용자를 Supabase Auth로 마이그레이션 시작...');
    
    // SQLite 데이터베이스 열기
    db = await openSqliteDb();
    
    // 사용자 마이그레이션
    const results = await migrateUsers(db);
    
    // 결과 저장
    saveResults(results);
    
    logger.success('사용자 Auth 마이그레이션이 완료되었습니다!');
    logger.info('모든 사용자에게 비밀번호 재설정을 요청하도록 안내하세요.');
    
  } catch (error) {
    logger.error(`마이그레이션 중 오류 발생: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // SQLite 데이터베이스 닫기
    if (db) {
      db.close();
    }
  }
}

// 스크립트 실행
main(); 