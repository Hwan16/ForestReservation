import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { auth } from '../../lib/supabase';

// POST /api/auth/logout - 사용자 로그아웃
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // Supabase 세션 종료
    const { error } = await auth.signOut();
    
    if (error) {
      console.error('로그아웃 오류:', error);
      return res.status(500).json(
        formatResponse(false, null, '로그아웃 중 오류가 발생했습니다.')
      );
    }
    
    // 쿠키 제거 헤더 설정
    res.setHeader('Set-Cookie', [
      'sb-access-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
      'sb-refresh-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
    ]);
    
    return res.status(200).json(
      formatResponse(true, null, '로그아웃 성공')
    );
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '로그아웃 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 