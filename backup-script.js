/**
 * 마이그레이션 전 백업 스크립트
 * 
 * 이 스크립트는 SQLite에서 Supabase로 마이그레이션하기 전에
 * 필요한 모든 데이터와 설정을 백업합니다.
 * 
 * 사용법: NODE_ENV=production node backup-script.js
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';

// 환경 변수 로드
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${nodeEnv}` });
dotenv.config({ path: `.env.${nodeEnv}.local` });

// 백업 설정
const BACKUP_DIR = './backups';
const SQLITE_DB_PATH = './forest.db';
const BACKUP_BRANCH = 'pre-supabase-migration';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// 로깅 유틸리티
const log = {
  info: (message) => console.log(`\x1b[36m[INFO]\x1b[0m ${message}`),
  warning: (message) => console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`),
  error: (message) => console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`)
};

// 백업 디렉토리 생성
function createBackupDir() {
  log.info('백업 디렉토리 생성 중...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    try {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      log.success(`백업 디렉토리가 생성되었습니다: ${BACKUP_DIR}`);
    } catch (error) {
      log.error(`백업 디렉토리 생성 실패: ${error.message}`);
      return false;
    }
  } else {
    log.info(`백업 디렉토리가 이미 존재합니다: ${BACKUP_DIR}`);
  }
  
  return true;
}

// SQLite 데이터베이스 백업
function backupSqliteDatabase() {
  log.info('SQLite 데이터베이스 백업 중...');
  
  // 데이터베이스 파일 확인
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    log.error(`SQLite 데이터베이스 파일을 찾을 수 없습니다: ${SQLITE_DB_PATH}`);
    return false;
  }
  
  // 백업 파일 생성
  const backupDbPath = path.join(BACKUP_DIR, 'forest.db.backup');
  try {
    fs.copyFileSync(SQLITE_DB_PATH, backupDbPath);
    
    // 타임스탬프 백업 추가
    const timestampBackupPath = path.join(BACKUP_DIR, `forest.db.${TIMESTAMP}.backup`);
    fs.copyFileSync(SQLITE_DB_PATH, timestampBackupPath);
    
    log.success(`데이터베이스가 성공적으로 백업되었습니다: ${backupDbPath}`);
    log.success(`타임스탬프 백업도 생성되었습니다: ${timestampBackupPath}`);
    return true;
  } catch (error) {
    log.error(`데이터베이스 백업 실패: ${error.message}`);
    return false;
  }
}

// 환경 변수 파일 백업
function backupEnvFiles() {
  log.info('환경 변수 파일 백업 중...');
  
  const envFiles = [
    `.env.${nodeEnv}`,
    `.env.${nodeEnv}.local`
  ];
  
  let allSuccessful = true;
  
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      try {
        const backupPath = path.join(BACKUP_DIR, `${file}.backup`);
        fs.copyFileSync(file, backupPath);
        
        // 타임스탬프 백업 추가
        const timestampBackupPath = path.join(BACKUP_DIR, `${file}.${TIMESTAMP}.backup`);
        fs.copyFileSync(file, timestampBackupPath);
        
        log.success(`환경 변수 파일이 성공적으로 백업되었습니다: ${backupPath}`);
      } catch (error) {
        log.error(`환경 변수 파일 백업 실패 (${file}): ${error.message}`);
        allSuccessful = false;
      }
    } else {
      log.warning(`환경 변수 파일이 존재하지 않습니다: ${file}`);
    }
  }
  
  return allSuccessful;
}

// Git 브랜치 백업
function createGitBackupBranch() {
  log.info('Git 브랜치 백업 중...');
  
  return new Promise((resolve) => {
    // 현재 브랜치 확인
    exec('git rev-parse --abbrev-ref HEAD', (error, currentBranch) => {
      if (error) {
        log.error(`현재 Git 브랜치 확인 실패: ${error.message}`);
        resolve(false);
        return;
      }
      
      currentBranch = currentBranch.trim();
      
      // 모든 변경사항이 커밋되었는지 확인
      exec('git status --porcelain', (error, status) => {
        if (error) {
          log.error(`Git 상태 확인 실패: ${error.message}`);
          resolve(false);
          return;
        }
        
        if (status.trim() !== '') {
          log.warning('커밋되지 않은 변경사항이 있습니다. 계속하기 전에 커밋하세요.');
          log.warning('변경 사항:');
          console.log(status);
          resolve(false);
          return;
        }
        
        // 백업 브랜치 생성
        exec(`git branch -f ${BACKUP_BRANCH}`, (error) => {
          if (error) {
            log.error(`백업 브랜치 생성 실패: ${error.message}`);
            resolve(false);
            return;
          }
          
          log.success(`백업 브랜치가 생성되었습니다: ${BACKUP_BRANCH}`);
          resolve(true);
        });
      });
    });
  });
}

// 메타데이터 백업
function createMetadataFile() {
  log.info('백업 메타데이터 생성 중...');
  
  const metadata = {
    timestamp: new Date().toISOString(),
    environment: nodeEnv,
    backupFiles: [],
    notes: 'SQLite에서 Supabase로의 마이그레이션 전 자동 백업'
  };
  
  // 백업 파일 목록 추가
  if (fs.existsSync(BACKUP_DIR)) {
    metadata.backupFiles = fs.readdirSync(BACKUP_DIR).map(file => ({ 
      filename: file, 
      path: path.join(BACKUP_DIR, file),
      size: fs.statSync(path.join(BACKUP_DIR, file)).size
    }));
  }
  
  // 패키지 정보 추가
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    metadata.packageInfo = {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: packageJson.dependencies
    };
  } catch (error) {
    log.warning(`package.json 파일을 읽을 수 없습니다: ${error.message}`);
  }
  
  // 메타데이터 파일 저장
  try {
    const metadataPath = path.join(BACKUP_DIR, `backup-metadata-${TIMESTAMP}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    log.success(`메타데이터 파일이 생성되었습니다: ${metadataPath}`);
    return true;
  } catch (error) {
    log.error(`메타데이터 파일 생성 실패: ${error.message}`);
    return false;
  }
}

// 메인 함수
async function main() {
  log.info('백업 스크립트를 시작합니다...');
  
  // 백업 디렉토리 생성
  const dirCreated = createBackupDir();
  if (!dirCreated) {
    log.error('백업 디렉토리를 생성할 수 없어 스크립트를 종료합니다.');
    process.exit(1);
  }
  
  // 백업 단계 실행
  const dbBackedUp = backupSqliteDatabase();
  const envBackedUp = backupEnvFiles();
  const gitBranchCreated = await createGitBackupBranch();
  const metadataCreated = createMetadataFile();
  
  // 백업 결과 요약
  log.info('\n===== 백업 결과 요약 =====');
  log.info(`SQLite 데이터베이스 백업: ${dbBackedUp ? '성공' : '실패'}`);
  log.info(`환경 변수 파일 백업: ${envBackedUp ? '성공' : '실패'}`);
  log.info(`Git 브랜치 백업: ${gitBranchCreated ? '성공' : '실패'}`);
  log.info(`메타데이터 파일 생성: ${metadataCreated ? '성공' : '실패'}`);
  
  if (dbBackedUp && envBackedUp && gitBranchCreated && metadataCreated) {
    log.success('\n백업이 성공적으로 완료되었습니다!');
    log.info(`모든 백업 파일은 ${BACKUP_DIR} 디렉토리에 저장되었습니다.`);
    log.info(`Git 백업 브랜치: ${BACKUP_BRANCH}`);
  } else {
    log.warning('\n백업 중 일부 단계가 실패했습니다.');
    log.info('수동으로 나머지 단계를 완료하세요.');
  }
}

// 스크립트 실행
main().catch((error) => {
  log.error(`예기치 않은 오류가 발생했습니다: ${error.message}`);
  process.exit(1);
}); 