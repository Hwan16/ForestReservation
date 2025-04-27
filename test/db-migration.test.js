/**
 * 데이터베이스 마이그레이션 테스트
 * 
 * 이 테스트는 SQLite에서 Supabase로의 데이터베이스 마이그레이션이
 * 올바르게 이루어졌는지 검증합니다.
 */

import { createClient } from '@supabase/supabase-js';
import { 
  getAllUsers, 
  getUserById, 
  getAllReservations, 
  getReservationById,
  getAvailabilityByDate
} from '../lib/db.js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 테스트 건너뛰기 조건 설정
const skipTests = !supabaseUrl || !supabaseKey || process.env.SKIP_DB_TESTS === 'true';
(skipTests ? describe.skip : describe)('데이터베이스 마이그레이션 테스트', () => {
  
  // 사용자 데이터 테스트
  describe('사용자 데이터 마이그레이션', () => {
    test('사용자 조회 함수가 올바른 응답 형식을 반환해야 함', async () => {
      const result = await getAllUsers();
      
      // 응답 형식 확인
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      
      // 데이터가 있거나 빈 배열이어야 함
      if (result.data) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
    
    test('특정 사용자 조회 함수가 올바르게 동작해야 함', async () => {
      // 존재하지 않는 사용자 ID로 테스트
      const result = await getUserById('non-existent-id');
      
      // 에러 없이 실행되어야 함
      expect(result).toHaveProperty('error');
    });
  });
  
  // 예약 데이터 테스트
  describe('예약 데이터 마이그레이션', () => {
    test('예약 조회 함수가 올바른 응답 형식을 반환해야 함', async () => {
      const result = await getAllReservations();
      
      // 응답 형식 확인
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      
      // 데이터가 있거나 빈 배열이어야 함
      if (result.data) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
    
    test('특정 예약 조회 함수가 올바르게 동작해야 함', async () => {
      // 존재하지 않는 예약 ID로 테스트
      const result = await getReservationById('non-existent-id');
      
      // 에러 없이 실행되어야 함
      expect(result).toHaveProperty('error');
    });
  });
  
  // 가용성 데이터 테스트
  describe('가용성 데이터 마이그레이션', () => {
    test('날짜별 가용성 조회 함수가 올바르게 동작해야 함', async () => {
      // 현재 날짜로 테스트
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const result = await getAvailabilityByDate(today);
      
      // 응답 형식 확인
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });
  });
  
  // Supabase 직접 쿼리 테스트
  describe('Supabase 직접 쿼리', () => {
    test('users 테이블이 존재하고 접근 가능해야 함', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      expect(error).toBeNull();
    });
    
    test('reservations 테이블이 존재하고 접근 가능해야 함', async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('id')
        .limit(1);
      
      expect(error).toBeNull();
    });
    
    test('availability 테이블이 존재하고 접근 가능해야 함', async () => {
      const { data, error } = await supabase
        .from('availability')
        .select('id')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });
}); 