import { NextApiRequest, NextApiResponse } from 'next';
import { withProtectedApi, formatResponse } from '../../lib/middleware';
import { db } from '../../lib/db';

// GET /api/reservations/search?query={query} - 예약 검색
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    const { query } = req.query;
    
    if (!query || Array.isArray(query) || query.trim() === '') {
      return res.status(400).json(
        formatResponse(false, null, '검색어를 입력해주세요.')
      );
    }
    
    // 예약 검색
    const results = await db.reservations.search(query);
    
    return res.status(200).json(
      formatResponse(true, results, '')
    );
  } catch (error) {
    console.error('예약 검색 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '예약 검색 중 오류가 발생했습니다.')
    );
  }
};

export default withProtectedApi(handler); 