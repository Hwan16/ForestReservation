import { NextApiRequest, NextApiResponse } from 'next';
import { withProtectedApi, formatResponse } from '../../lib/middleware';
import { auth } from '../../lib/supabase';
import { ZodError, z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// 비밀번호 변경 스키마
const updatePasswordSchema = z.object({
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
  newPassword: z.string().min(6, "새 비밀번호는 최소 6자 이상이어야 합니다.")
}).refine(data => data.password !== data.newPassword, {
  message: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
  path: ["newPassword"]
});

// POST /api/auth/update-password - 비밀번호 변경
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 요청 데이터 유효성 검증
    const data = updatePasswordSchema.parse(req.body);
    
    // 현재 사용자 정보 확인 (withProtectedApi 미들웨어에서 추가됨)
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        formatResponse(false, null, '인증이 필요합니다.')
      );
    }
    
    // 현재 비밀번호 확인
    const { error: signInError } = await auth.signInWithPassword(user.email, data.password);
    
    if (signInError) {
      return res.status(400).json(
        formatResponse(false, null, '현재 비밀번호가 올바르지 않습니다.')
      );
    }
    
    // 새 비밀번호로 업데이트
    const { error } = await auth.updatePassword(data.newPassword);
    
    if (error) {
      return res.status(500).json(
        formatResponse(false, null, '비밀번호 변경 중 오류가 발생했습니다.')
      );
    }
    
    // 응답 반환
    return res.status(200).json(
      formatResponse(true, null, '비밀번호가 성공적으로 변경되었습니다.')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }
    
    console.error('비밀번호 변경 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '비밀번호 변경 중 오류가 발생했습니다.')
    );
  }
};

export default withProtectedApi(handler); 