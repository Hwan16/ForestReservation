import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { loginSchema } from '../../shared/schema';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// POST /api/admin/login - 관리자 로그인
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 로그인 데이터 유효성 검증
    const data = loginSchema.parse(req.body);
    
    // 사용자 조회
    const user = await db.users.getByUsername(data.username);
    
    // 관리자 확인
    if (!user || user.password !== data.password || !user.is_admin) {
      return res.status(401).json(
        formatResponse(false, null, '관리자 로그인에 실패했습니다.')
      );
    }
    
    // Supabase 세션 생성 (커스텀 JWT)
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: `${data.username}@example.com`, // 임시 이메일
      password: data.password
    });
    
    if (error) {
      console.error('Supabase 인증 오류:', error);
      return res.status(500).json(
        formatResponse(false, null, '로그인 중 오류가 발생했습니다.')
      );
    }
    
    // 응답 반환
    return res.status(200).json(
      formatResponse(true, { 
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin
        },
        session: authData.session
      }, '관리자 로그인 성공')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }
    
    console.error('관리자 로그인 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '로그인 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 