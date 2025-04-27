import { NextApiRequest, NextApiResponse } from 'next';
import { withProtectedApi, formatResponse } from '../../../lib/middleware';
import { db } from '../../../lib/db';

// GET /api/reservations/date/[date] - 특정 날짜의 예약 조회
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    const { date } = req.query;
    
    if (!date || Array.isArray(date) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json(
        formatResponse(false, null, '유효한 날짜 형식이 아닙니다. YYYY-MM-DD 형식을 사용하세요.')
      );
    }
    
    // 해당 날짜의 예약 조회
    const reservations = await db.reservations.getByDate(date);
    
    return res.status(200).json(
      formatResponse(true, reservations, '')
    );
  } catch (error) {
    console.error('날짜별 예약 조회 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '예약 정보를 불러오는 중 오류가 발생했습니다.')
    );
  }
};

export default withProtectedApi(handler); 