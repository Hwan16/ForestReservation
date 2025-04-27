import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { cookies } from 'next/headers';

// 환경 변수에서 Supabase URL과 API 키 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 이 값들이 없으면 오류 발생
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 클라이언트 측 Supabase 클라이언트 생성
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 서버 측 Supabase 클라이언트 생성 (Next.js 서버 컴포넌트용)
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
};

// 사용자 인증 관련 함수들
export const auth = {
  // 로그인 (이메일/비밀번호)
  async signInWithPassword(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // 회원가입
  async signUp(email: string, password: string, userData: { username: string, is_admin?: boolean }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    return { data, error };
  },

  // 로그아웃
  async signOut() {
    return await supabase.auth.signOut();
  },

  // 현재 세션 가져오기
  async getSession() {
    return await supabase.auth.getSession();
  },

  // 현재 사용자 가져오기
  async getUser() {
    return await supabase.auth.getUser();
  },

  // 비밀번호 재설정 이메일 보내기
  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });
  },

  // 새 비밀번호로 업데이트하기
  async updatePassword(new_password: string) {
    return await supabase.auth.updateUser({ password: new_password });
  },

  // 토큰 검증
  async verifyToken(token: string) {
    // JWT 토큰 검증 로직
    try {
      const { data, error } = await supabase.auth.getUser(token);
      return { valid: !!data.user && !error, user: data.user };
    } catch (error) {
      return { valid: false, user: null };
    }
  },
};

export default supabase; 