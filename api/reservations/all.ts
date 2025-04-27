import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminApi, formatResponse } from '../../lib/middleware';
import { db } from '../../lib/db';

// GET /api/reservations/all - 모든 예약 조회 (관리자 전용)
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 모든 예약 조회
    const reservations = await db.reservations.getAll();
    
    return res.status(200).json(
      formatResponse(true, reservations, '')
    );
  } catch (error) {
    console.error('예약 목록 조회 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '예약 목록을 불러오는 중 오류가 발생했습니다.')
    );
  }
};

export default withAdminApi(handler); 