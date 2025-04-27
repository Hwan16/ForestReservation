// Jest 설정 파일

import dotenv from 'dotenv';
import { resolve } from 'path';
import { expand } from 'dotenv-expand';

// 테스트 환경에 맞는 환경 변수 로드
const envPath = resolve(process.cwd(), '.env.test');
const myEnv = dotenv.config({ path: envPath });
expand(myEnv);

// 환경 변수가 제대로 로드되었는지 확인
console.log(`[Test Setup] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Test Setup] Test timeout: ${process.env.TEST_TIMEOUT || 5000}ms`);

// Jest 설정 업데이트
jest.setTimeout(parseInt(process.env.TEST_TIMEOUT || '5000', 10));

// 테스트에서 사용할 전역 모의 설정
global.testData = {
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser'
  },
  validReservation: {
    date: '2023-12-15',
    timeSlot: 'morning',
    name: '테스트어린이집',
    instName: '테스트선생님',
    phone: '01012345678',
    participants: 10,
    desiredActivity: 'all',
    parentParticipation: 'no'
  }
};

// 테스트가 끝난 후 실행될 코드
afterAll(async () => {
  // 테스트 후 정리 작업 (주로 연결을 닫는 용도)
  console.log('[Test Setup] All tests completed');
}); 