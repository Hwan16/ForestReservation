import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { resetPasswordRequestSchema } from '../../shared/schema';
import { auth } from '../../lib/supabase';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// POST /api/auth/reset-password - 비밀번호 재설정 요청
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 요청 데이터 유효성 검증
    const data = resetPasswordRequestSchema.parse(req.body);
    
    // 비밀번호 재설정 이메일 발송
    const { error } = await auth.resetPassword(data.email);
    
    if (error) {
      // 에러가 발생하더라도 보안을 위해 사용자에게는 동일한 메시지 전달
      console.error('비밀번호 재설정 요청 오류:', error);
      
      // 성공적으로 처리된 것처럼 응답 (보안상 사용자 존재 여부를 노출하지 않음)
      return res.status(200).json(
        formatResponse(true, null, '비밀번호 재설정 이메일이 발송되었습니다.')
      );
    }
    
    // 응답 반환
    return res.status(200).json(
      formatResponse(true, null, '비밀번호 재설정 이메일이 발송되었습니다.')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }
    
    console.error('비밀번호 재설정 요청 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 