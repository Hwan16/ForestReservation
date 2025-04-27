import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../../lib/middleware';
import { db } from '../../../lib/db';

// GET /api/calendar/[year]/[month] - 특정 월의 가용성 정보 조회 (달력에서 사용)
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    const { year, month } = req.query;

    // 유효한 년도와 월 형식 확인
    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json(
        formatResponse(false, null, '유효하지 않은 날짜 형식입니다.')
      );
    }
    
    // 월이 한 자리 수면 앞에 0 붙이기
    const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
    const yearMonthStr = `${yearNum}-${monthStr}`;
    
    // 서버 로그
    console.log(`Calendar API 요청: ${yearMonthStr}`);
    
    // 가용성 정보 가져오기
    const availabilities = await db.availability.getByMonth(yearMonthStr);
    
    // 클라이언트에서 사용하기 쉬운 형태로 변환
    const calendarData = availabilities.map(item => ({
      date: item.date,
      morningReserved: !item.status.morning.available,
      afternoonReserved: !item.status.afternoon.available
    }));
    
    return res.status(200).json(
      formatResponse(true, calendarData, '')
    );
  } catch (error) {
    console.error('월별 가용성 정보 조회 중 오류 발생:', error);
    return res.status(500).json(
      formatResponse(false, null, '가용성 정보를 불러오는 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 