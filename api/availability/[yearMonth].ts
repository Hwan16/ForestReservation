import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { db } from '../../lib/db';

// GET /api/availability/[yearMonth] - 월별 가용성 조회
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    const { yearMonth } = req.query;
    
    if (!yearMonth || Array.isArray(yearMonth) || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return res.status(400).json(
        formatResponse(false, null, '유효한 년월 형식이 아닙니다. YYYY-MM 형식을 사용하세요.')
      );
    }
    
    // 해당 월의 가용성 조회
    const availabilities = await db.availability.getByMonth(yearMonth);
    
    return res.status(200).json(
      formatResponse(true, availabilities, '')
    );
  } catch (error) {
    console.error('월별 가용성 조회 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '가용성 정보를 불러오는 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 