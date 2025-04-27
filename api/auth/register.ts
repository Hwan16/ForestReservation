import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { registerSchema } from '../../shared/schema';
import { auth } from '../../lib/supabase';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// POST /api/auth/register - 사용자 회원가입
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 회원가입 데이터 유효성 검증
    const data = registerSchema.parse(req.body);
    
    // 비밀번호 확인 검증은 registerSchema의 refine으로 처리되므로 여기서는 별도 검증하지 않음
    
    // Supabase Auth로 회원가입
    const { data: authData, error } = await auth.signUp(
      data.email, 
      data.password, 
      {
        username: data.username,
        is_admin: false // 기본적으로 일반 사용자로 가입
      }
    );
    
    if (error) {
      // 회원가입 실패
      const errorMessage = 
        error.message === 'User already registered' ? '이미 등록된 이메일입니다.' :
        error.message === 'Password should be at least 6 characters' ? '비밀번호는 최소 6자 이상이어야 합니다.' :
        error.message;
      
      return res.status(400).json(
        formatResponse(false, null, errorMessage)
      );
    }
    
    // 응답 반환
    return res.status(201).json(
      formatResponse(true, { 
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          username: data.username
        }
      }, '회원가입이 완료되었습니다. 이메일 확인을 진행해주세요.')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }
    
    console.error('회원가입 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '회원가입 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 