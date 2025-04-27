import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { resetPasswordSchema } from '../../shared/schema';
import { auth } from '../../lib/supabase';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// POST /api/auth/reset-password-confirm - 비밀번호 재설정 처리
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 요청 데이터 유효성 검증
    const data = resetPasswordSchema.parse(req.body);
    
    // 비밀번호 재설정
    const { error } = await auth.updatePassword(data.password);
    
    if (error) {
      // 오류 메시지 처리
      const errorMessage = error.message.includes("Auth session not found") 
        ? "세션이 만료되었습니다. 비밀번호 재설정 링크를 다시 요청해주세요."
        : "비밀번호 재설정 중 오류가 발생했습니다.";
      
      return res.status(400).json(
        formatResponse(false, null, errorMessage)
      );
    }
    
    // 응답 반환
    return res.status(200).json(
      formatResponse(true, null, '비밀번호가 성공적으로 재설정되었습니다.')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }
    
    console.error('비밀번호 재설정 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '비밀번호 재설정 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 