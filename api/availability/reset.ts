import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminApi, formatResponse } from '../../lib/middleware';
import { db } from '../../lib/db';

// DELETE /api/availability/reset - 가용성 및 예약 데이터 초기화 (관리자 전용)
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 가용성 데이터 초기화
    await db.availability.reset();
    
    return res.status(200).json(
      formatResponse(true, null, '모든 예약 및 가용성 데이터가 초기화되었습니다.')
    );
  } catch (error) {
    console.error('가용성 초기화 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '데이터 초기화 중 오류가 발생했습니다.')
    );
  }
};

export default withAdminApi(handler); 