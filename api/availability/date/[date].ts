import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../../lib/middleware';
import { db } from '../../../lib/db';

// GET /api/availability/date/[date] - 특정 날짜의 가용성 조회
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
    
    // 해당 날짜의 가용성 조회
    const availability = await db.availability.getByDate(date);
    
    return res.status(200).json(
      formatResponse(true, availability, '')
    );
  } catch (error) {
    console.error('날짜별 가용성 조회 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '가용성 정보를 불러오는 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 