import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { loginSchema } from '../../shared/schema';
import { auth } from '../../lib/supabase';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// POST /api/auth/login - 사용자 로그인
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 로그인 데이터 유효성 검증
    const data = loginSchema.parse(req.body);
    
    // Supabase Auth로 로그인
    const { data: authData, error } = await auth.signInWithPassword(data.email, data.password);
    
    if (error) {
      // 로그인 실패
      const errorMessage = error.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : error.message;
      
      return res.status(401).json(
        formatResponse(false, null, errorMessage)
      );
    }
    
    // 응답 반환
    return res.status(200).json(
      formatResponse(true, { 
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          username: authData.user?.user_metadata?.username,
          isAdmin: authData.user?.user_metadata?.is_admin
        },
        session: {
          accessToken: authData.session?.access_token,
          refreshToken: authData.session?.refresh_token,
          expiresAt: authData.session?.expires_at
        }
      }, '로그인 성공')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }
    
    console.error('로그인 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '로그인 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 