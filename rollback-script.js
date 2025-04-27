/**
 * 마이그레이션 롤백 스크립트
 * 
 * 이 스크립트는 Supabase에서 SQLite로의 롤백을 수행합니다.
 * 심각한 문제가 발생했을 때만 사용하세요.
 * 
 * 사용법: NODE_ENV=production node rollback-script.js
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';

// 환경 변수 로드
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${nodeEnv}` });
dotenv.config({ path: `.env.${nodeEnv}.local` });

// 롤백 설정
const BACKUP_DIR = './backups';
const SQLITE_DB_PATH = './forest.db';
const CODE_BACKUP_BRANCH = 'pre-supabase-migration';
const ENV_BACKUP_PATH = path.join(BACKUP_DIR, `.env.${nodeEnv}.backup`);

// 로깅 유틸리티
const log = {
  info: (message) => console.log(`\x1b[36m[INFO]\x1b[0m ${message}`),
  warning: (message) => console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`),
  error: (message) => console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`)
};

// 사용자 확인 함수
async function confirmRollback() {
  log.warning('이 작업은 되돌릴 수 없습니다!');
  log.warning('Supabase에서 SQLite로 롤백하면 Supabase에서 생성된 모든 데이터가 손실됩니다.');
  
  process.stdout.write('\x1b[33m[WARNING]\x1b[0m 계속하시겠습니까? (y/N): ');
  
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase();
      resolve(input === 'y' || input === 'yes');
    });
  });
}

// SQLite 데이터베이스 복원
function restoreSqliteDatabase() {
  log.info('SQLite 데이터베이스 복원 중...');
  
  const backupDbPath = path.join(BACKUP_DIR, 'forest.db.backup');
  
  if (!fs.existsSync(backupDbPath)) {
    log.error(`백업 파일을 찾을 수 없습니다: ${backupDbPath}`);
    return false;
  }
  
  try {
    fs.copyFileSync(backupDbPath, SQLITE_DB_PATH);
    log.success('SQLite 데이터베이스가 성공적으로 복원되었습니다.');
    return true;
  } catch (error) {
    log.error(`SQLite 데이터베이스 복원 실패: ${error.message}`);
    return false;
  }
}

// 코드 롤백
function rollbackCode() {
  log.info('코드 롤백 중...');
  
  return new Promise((resolve) => {
    exec(`git checkout ${CODE_BACKUP_BRANCH}`, (error) => {
      if (error) {
        log.error(`코드 롤백 실패: ${error.message}`);
        resolve(false);
        return;
      }
      
      log.success(`성공적으로 ${CODE_BACKUP_BRANCH} 브랜치로 전환했습니다.`);
      resolve(true);
    });
  });
}

// 환경 변수 복원
function restoreEnvFile() {
  log.info('환경 변수 설정 복원 중...');
  
  if (!fs.existsSync(ENV_BACKUP_PATH)) {
    log.error(`환경 변수 백업 파일을 찾을 수 없습니다: ${ENV_BACKUP_PATH}`);
    return false;
  }
  
  try {
    fs.copyFileSync(ENV_BACKUP_PATH, `.env.${nodeEnv}`);
    if (fs.existsSync(`.env.${nodeEnv}.local`)) {
      fs.unlinkSync(`.env.${nodeEnv}.local`);
    }
    log.success('환경 변수 설정이 성공적으로 복원되었습니다.');
    return true;
  } catch (error) {
    log.error(`환경 변수 복원 실패: ${error.message}`);
    return false;
  }
}

// 패키지 의존성 업데이트
function updateDependencies() {
  log.info('패키지 의존성 업데이트 중...');
  
  return new Promise((resolve) => {
    exec('npm install', (error) => {
      if (error) {
        log.error(`패키지 의존성 업데이트 실패: ${error.message}`);
        resolve(false);
        return;
      }
      
      log.success('패키지 의존성이 성공적으로 업데이트되었습니다.');
      resolve(true);
    });
  });
}

// 메인 함수
async function main() {
  log.info('마이그레이션 롤백 스크립트를 시작합니다...');
  
  // 백업 디렉토리 확인
  if (!fs.existsSync(BACKUP_DIR)) {
    log.error(`백업 디렉토리를 찾을 수 없습니다: ${BACKUP_DIR}`);
    process.exit(1);
  }
  
  // 사용자 확인
  const confirmed = await confirmRollback();
  if (!confirmed) {
    log.info('롤백이 취소되었습니다.');
    process.exit(0);
  }
  
  // 롤백 단계 실행
  const sqliteRestored = restoreSqliteDatabase();
  if (!sqliteRestored) {
    log.warning('SQLite 데이터베이스 복원에 실패했습니다. 계속하시겠습니까? (y/N): ');
    const continueAfterDbFailure = await new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        const input = data.toString().trim().toLowerCase();
        resolve(input === 'y' || input === 'yes');
      });
    });
    
    if (!continueAfterDbFailure) {
      log.info('롤백이 취소되었습니다.');
      process.exit(1);
    }
  }
  
  const codeRolledBack = await rollbackCode();
  const envRestored = restoreEnvFile();
  const dependenciesUpdated = await updateDependencies();
  
  // 롤백 결과 요약
  log.info('\n===== 롤백 결과 요약 =====');
  log.info(`SQLite 데이터베이스 복원: ${sqliteRestored ? '성공' : '실패'}`);
  log.info(`코드 롤백: ${codeRolledBack ? '성공' : '실패'}`);
  log.info(`환경 변수 복원: ${envRestored ? '성공' : '실패'}`);
  log.info(`패키지 의존성 업데이트: ${dependenciesUpdated ? '성공' : '실패'}`);
  
  if (sqliteRestored && codeRolledBack && envRestored && dependenciesUpdated) {
    log.success('\n롤백이 성공적으로 완료되었습니다!');
    log.info('이제 다음 명령어를 실행하여 서버를 시작하세요:');
    log.info('npm run dev');
  } else {
    log.warning('\n롤백 중 일부 단계가 실패했습니다.');
    log.info('수동으로 나머지 단계를 완료하세요.');
  }
}

// 스크립트 실행
main().catch((error) => {
  log.error(`예기치 않은 오류가 발생했습니다: ${error.message}`);
  process.exit(1);
}); 