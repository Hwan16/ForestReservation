/**
 * migrate-data.js
 * 
 * SQLite에서 Supabase로 데이터를 마이그레이션하는 스크립트입니다.
 * 이 스크립트는 모든 사용자, 예약, 가용성, 파일 데이터를 마이그레이션합니다.
 */

// 필요한 모듈 불러오기
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// 환경 변수 설정
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: envFile });
console.log(`환경 변수 로드: ${envFile}`);

// 설정
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './database.sqlite';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 100;  // 한 번에 삽입할 레코드 수

// 유효성 검사
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('오류: Supabase URL과 서비스 롤 키를 환경 변수에 설정해야 합니다.');
  process.exit(1);
}

// Supabase 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 로깅 유틸리티
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
};

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

// 사용자 마이그레이션
async function migrateUsers(db) {
  logger.info('사용자 마이그레이션 시작...');
  
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', async (err, rows) => {
      if (err) {
        return reject(err);
      }
      
      logger.info(`마이그레이션할 사용자 ${rows.length}명 발견`);
      const migrationResults = { success: 0, failed: 0, users: [] };
      
      // 배치 처리
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const batchData = [];
        
        for (const user of batch) {
          // Supabase Auth는 별도로 처리해야 함
          batchData.push({
            id: uuidv4(),
            email: user.email,
            username: user.username,
            password_hash: user.password,  // bcrypt 해시는 그대로 사용 가능
            role: user.role || 'user',
            created_at: new Date(user.created_at).toISOString()
          });
        }
        
        const { data, error } = await supabase.from('users').insert(batchData);
        
        if (error) {
          logger.error(`배치 사용자 삽입 실패: ${error.message}`);
          migrationResults.failed += batch.length;
        } else {
          logger.success(`배치 ${i/BATCH_SIZE + 1} 사용자 삽입 성공`);
          migrationResults.success += batch.length;
          migrationResults.users = migrationResults.users.concat(data || []);
        }
      }
      
      logger.info(`사용자 마이그레이션 완료: ${migrationResults.success} 성공, ${migrationResults.failed} 실패`);
      resolve(migrationResults);
    });
  });
}

// 예약 마이그레이션
async function migrateReservations(db, users) {
  logger.info('예약 마이그레이션 시작...');
  
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM reservations', async (err, rows) => {
      if (err) {
        return reject(err);
      }
      
      logger.info(`마이그레이션할 예약 ${rows.length}개 발견`);
      const migrationResults = { success: 0, failed: 0, reservations: [] };
      
      // SQLite userID를 Supabase user ID로 매핑
      const userEmailToIdMap = new Map();
      const { data: supabaseUsers, error: userError } = await supabase.from('users').select('id,email');
      
      if (userError) {
        logger.error(`Supabase 사용자 조회 실패: ${userError.message}`);
        return reject(userError);
      }
      
      supabaseUsers.forEach(user => {
        userEmailToIdMap.set(user.email, user.id);
      });
      
      // 배치 처리
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const batchData = [];
        
        for (const reservation of batch) {
          // SQLite userId로 사용자 이메일 조회
          const sqliteUserPromise = new Promise((resolveUser, rejectUser) => {
            db.get('SELECT email FROM users WHERE id = ?', [reservation.user_id], (userErr, user) => {
              if (userErr || !user) {
                logger.warn(`사용자 이메일 조회 실패, reservation_id=${reservation.id}, userId=${reservation.user_id}`);
                resolveUser(null);
              } else {
                resolveUser(user.email);
              }
            });
          });
          
          const userEmail = await sqliteUserPromise;
          const supabaseUserId = userEmailToIdMap.get(userEmail);
          
          if (!supabaseUserId) {
            logger.warn(`Supabase 사용자 ID를 찾을 수 없음, reservation_id=${reservation.id}, email=${userEmail}`);
            migrationResults.failed++;
            continue;
          }
          
          batchData.push({
            id: uuidv4(),
            user_id: supabaseUserId,
            reservation_date: reservation.date,
            time_slot: reservation.time_slot,
            status: reservation.status || 'pending',
            created_at: new Date(reservation.created_at).toISOString()
          });
        }
        
        if (batchData.length > 0) {
          const { data, error } = await supabase.from('reservations').insert(batchData);
          
          if (error) {
            logger.error(`배치 예약 삽입 실패: ${error.message}`);
            migrationResults.failed += batchData.length;
          } else {
            logger.success(`배치 ${i/BATCH_SIZE + 1} 예약 삽입 성공`);
            migrationResults.success += batchData.length;
            migrationResults.reservations = migrationResults.reservations.concat(data || []);
          }
        }
      }
      
      logger.info(`예약 마이그레이션 완료: ${migrationResults.success} 성공, ${migrationResults.failed} 실패`);
      resolve(migrationResults);
    });
  });
}

// 가용성 마이그레이션
async function migrateAvailability(db) {
  logger.info('가용성 마이그레이션 시작...');
  
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM availability', async (err, rows) => {
      if (err) {
        return reject(err);
      }
      
      logger.info(`마이그레이션할 가용성 항목 ${rows.length}개 발견`);
      const migrationResults = { success: 0, failed: 0 };
      
      // 배치 처리
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const batchData = batch.map(item => ({
          id: uuidv4(),
          date: item.date,
          time_slot: item.time_slot,
          status: item.status || 'available'
        }));
        
        const { data, error } = await supabase.from('availability').insert(batchData);
        
        if (error) {
          logger.error(`배치 가용성 삽입 실패: ${error.message}`);
          migrationResults.failed += batch.length;
        } else {
          logger.success(`배치 ${i/BATCH_SIZE + 1} 가용성 삽입 성공`);
          migrationResults.success += batch.length;
        }
      }
      
      logger.info(`가용성 마이그레이션 완료: ${migrationResults.success} 성공, ${migrationResults.failed} 실패`);
      resolve(migrationResults);
    });
  });
}

// 파일 마이그레이션 (메타데이터만 마이그레이션, 실제 파일은 별도로 처리해야 함)
async function migrateFiles(db) {
  logger.info('파일 메타데이터 마이그레이션 시작...');
  
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM files', async (err, rows) => {
      if (err) {
        return reject(err);
      }
      
      logger.info(`마이그레이션할 파일 ${rows.length}개 발견`);
      const migrationResults = { success: 0, failed: 0 };
      
      // SQLite userID와 reservationID를 Supabase ID로 매핑
      const userEmailToIdMap = new Map();
      const reservationDateToIdMap = new Map();
      
      // 사용자 조회
      const { data: supabaseUsers, error: userError } = await supabase.from('users').select('id,email');
      if (userError) {
        logger.error(`Supabase 사용자 조회 실패: ${userError.message}`);
        return reject(userError);
      }
      
      supabaseUsers.forEach(user => {
        userEmailToIdMap.set(user.email, user.id);
      });
      
      // 예약 조회
      const { data: supabaseReservations, error: reservationError } = await supabase.from('reservations').select('id,reservation_date,time_slot');
      if (reservationError) {
        logger.error(`Supabase 예약 조회 실패: ${reservationError.message}`);
        return reject(reservationError);
      }
      
      supabaseReservations.forEach(reservation => {
        const key = `${reservation.reservation_date}_${reservation.time_slot}`;
        reservationDateToIdMap.set(key, reservation.id);
      });
      
      // 배치 처리
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const batchData = [];
        
        for (const file of batch) {
          // SQLite userId로 사용자 이메일 조회
          const userEmailPromise = new Promise((resolveUser, rejectUser) => {
            db.get('SELECT email FROM users WHERE id = ?', [file.user_id], (userErr, user) => {
              if (userErr || !user) {
                logger.warn(`사용자 이메일 조회 실패, file_id=${file.id}`);
                resolveUser(null);
              } else {
                resolveUser(user.email);
              }
            });
          });
          
          // SQLite reservationId로 예약 정보 조회
          const reservationKeyPromise = new Promise((resolveReservation, rejectReservation) => {
            if (!file.reservation_id) {
              resolveReservation(null);
              return;
            }
            
            db.get('SELECT date, time_slot FROM reservations WHERE id = ?', [file.reservation_id], (reservationErr, reservation) => {
              if (reservationErr || !reservation) {
                logger.warn(`예약 정보 조회 실패, file_id=${file.id}, reservation_id=${file.reservation_id}`);
                resolveReservation(null);
              } else {
                resolveReservation(`${reservation.date}_${reservation.time_slot}`);
              }
            });
          });
          
          const [userEmail, reservationKey] = await Promise.all([userEmailPromise, reservationKeyPromise]);
          
          const supabaseUserId = userEmailToIdMap.get(userEmail);
          const supabaseReservationId = reservationKey ? reservationDateToIdMap.get(reservationKey) : null;
          
          if (!supabaseUserId) {
            logger.warn(`Supabase 사용자 ID를 찾을 수 없음, file_id=${file.id}`);
            migrationResults.failed++;
            continue;
          }
          
          batchData.push({
            id: uuidv4(),
            filename: file.filename,
            path: file.path,
            user_id: supabaseUserId,
            reservation_id: supabaseReservationId || null,
            created_at: new Date(file.created_at).toISOString()
          });
        }
        
        if (batchData.length > 0) {
          const { data, error } = await supabase.from('files').insert(batchData);
          
          if (error) {
            logger.error(`배치 파일 메타데이터 삽입 실패: ${error.message}`);
            migrationResults.failed += batchData.length;
          } else {
            logger.success(`배치 ${i/BATCH_SIZE + 1} 파일 메타데이터 삽입 성공`);
            migrationResults.success += batchData.length;
          }
        }
      }
      
      logger.info(`파일 메타데이터 마이그레이션 완료: ${migrationResults.success} 성공, ${migrationResults.failed} 실패`);
      resolve(migrationResults);
    });
  });
}

// 마이그레이션 요약 만들기
function createMigrationSummary(results) {
  return {
    timestamp: new Date().toISOString(),
    users: {
      total: results.users.success + results.users.failed,
      migrated: results.users.success,
      failed: results.users.failed
    },
    reservations: {
      total: results.reservations.success + results.reservations.failed,
      migrated: results.reservations.success,
      failed: results.reservations.failed
    },
    availability: {
      total: results.availability.success + results.availability.failed,
      migrated: results.availability.success,
      failed: results.availability.failed
    },
    files: {
      total: results.files.success + results.files.failed,
      migrated: results.files.success,
      failed: results.files.failed
    }
  };
}

// 메인 함수
async function main() {
  let db;
  try {
    logger.info('SQLite에서 Supabase로 데이터 마이그레이션 시작...');
    
    // SQLite 데이터베이스 열기
    db = await openSqliteDb();
    
    // 사용자 마이그레이션
    const usersResult = await migrateUsers(db);
    
    // 예약 마이그레이션
    const reservationsResult = await migrateReservations(db, usersResult.users);
    
    // 가용성 마이그레이션
    const availabilityResult = await migrateAvailability(db);
    
    // 파일 마이그레이션
    const filesResult = await migrateFiles(db);
    
    // 마이그레이션 요약
    const summary = createMigrationSummary({
      users: usersResult,
      reservations: reservationsResult,
      availability: availabilityResult,
      files: filesResult
    });
    
    // 요약 저장
    const summaryFile = path.join(__dirname, 'migration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    logger.info(`마이그레이션 요약이 저장되었습니다: ${summaryFile}`);
    
    logger.success('데이터 마이그레이션이 완료되었습니다!');
    
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