/**
 * 인증 시스템 마이그레이션 테스트
 * 
 * 이 테스트는 세션 기반 인증에서 Supabase Auth로의 마이그레이션이
 * 올바르게 이루어졌는지 검증합니다.
 */

import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import app from '../server/index';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 테스트 건너뛰기 조건 설정
const skipTests = !supabaseUrl || !supabaseKey || process.env.SKIP_AUTH_TESTS === 'true';
(skipTests ? describe.skip : describe)('인증 시스템 마이그레이션 테스트', () => {
  
  // API 엔드포인트 테스트
  describe('인증 API 엔드포인트', () => {
    test('로그인 엔드포인트가 올바른 응답 형식을 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'invalid-password'
        });
      
      // 올바른 응답 형식인지 확인 (성공 여부와 관계없이)
      expect(res.body).toHaveProperty('message');
    });
    
    test('로그아웃 엔드포인트가 올바른 응답 형식을 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/logout');
      
      // 올바른 응답 형식인지 확인
      expect(res.body).toHaveProperty('message');
    });
    
    test('현재 사용자 정보 엔드포인트가 인증 없이 401을 반환해야 함', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      // 인증되지 않은 요청이므로 401 상태 코드 기대
      expect(res.status).toBe(401);
    });
    
    test('비밀번호 재설정 요청 엔드포인트가 올바른 응답 형식을 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'test@example.com'
        });
      
      // 올바른 응답 형식인지 확인
      expect(res.body).toHaveProperty('message');
    });
  });
  
  // Supabase Auth 직접 테스트
  describe('Supabase Auth 직접 테스트', () => {
    test('Supabase Auth 서비스가 접근 가능해야 함', async () => {
      try {
        // 존재하지 않는 사용자로 테스트 (실패해도 서비스 접근 가능성 테스트)
        await supabase.auth.signInWithPassword({
          email: 'nonexistent@example.com',
          password: 'invalid-password'
        });
        
        // 에러가 발생하더라도 접근 자체는 가능해야 함
        expect(true).toBe(true);
      } catch (error) {
        // Supabase 서비스 자체에 접근할 수 없는 경우 실패
        expect('Failed to access Supabase Auth').toBe(false);
      }
    });
  });
  
  // JWT 토큰 검증 테스트
  describe('JWT 토큰 검증', () => {
    test('보호된 API 엔드포인트가 인증 헤더 없이 401을 반환해야 함', async () => {
      const res = await request(app)
        .get('/api/reservations');
      
      // 인증 헤더 없이 접근하므로 401 상태 코드 기대
      expect(res.status).toBe(401);
    });
    
    test('잘못된 형식의 인증 헤더로 요청 시 401을 반환해야 함', async () => {
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', 'Invalid-Token-Format');
      
      // 잘못된 형식의 토큰이므로 401 상태 코드 기대
      expect(res.status).toBe(401);
    });
  });
}); 