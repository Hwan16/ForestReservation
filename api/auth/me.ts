import { NextApiRequest, NextApiResponse } from 'next';
import { withProtectedApi, formatResponse } from '../../lib/middleware';
import { auth } from '../../lib/supabase';

// GET /api/auth/me - 현재 로그인한 사용자 정보 조회
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 현재 사용자 정보 조회
    // withProtectedApi 미들웨어에서 검증된 req.user 정보 사용
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        formatResponse(false, null, '사용자 정보를 찾을 수 없습니다.')
      );
    }
    
    // 응답 데이터 가공
    const userData = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username,
      isAdmin: user.user_metadata?.is_admin === true
    };
    
    // 응답 반환
    return res.status(200).json(
      formatResponse(true, userData, '')
    );
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '사용자 정보를 불러오는 중 오류가 발생했습니다.')
    );
  }
};

export default withProtectedApi(handler); 