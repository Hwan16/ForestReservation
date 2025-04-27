import { NextApiRequest, NextApiResponse } from 'next';
import { withProtectedApi, formatResponse } from '../../lib/middleware';
import { db } from '../../lib/db';

// GET /api/reservations/[id] - 예약 조회
// DELETE /api/reservations/[id] - 예약 삭제
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json(
      formatResponse(false, null, '유효하지 않은 예약 ID입니다.')
    );
  }
  
  try {
    // 예약 조회
    const reservation = await db.reservations.getById(id);
    
    if (!reservation) {
      return res.status(404).json(
        formatResponse(false, null, '예약을 찾을 수 없습니다.')
      );
    }
    
    // GET 요청 처리
    if (req.method === 'GET') {
      return res.status(200).json(
        formatResponse(true, reservation, '')
      );
    }
    
    // DELETE 요청 처리
    if (req.method === 'DELETE') {
      // 가용성 정보 조회
      const availability = await db.availability.getByTimeSlot(
        reservation.date,
        reservation.time_slot
      );
      
      if (availability) {
        // 가용성 업데이트 (예약 인원 감소)
        await db.availability.update(
          reservation.date,
          reservation.time_slot,
          {
            reserved: Math.max(0, availability.reserved - reservation.participants)
          }
        );
      }
      
      // 예약 삭제
      await db.reservations.delete(id);
      
      return res.status(200).json(
        formatResponse(true, null, '예약이 성공적으로 삭제되었습니다.')
      );
    }
    
    // 지원하지 않는 HTTP 메서드
    return res.status(405).json(
      formatResponse(false, null, '잘못된 요청 메서드입니다.')
    );
  } catch (error) {
    console.error('예약 처리 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '요청 처리 중 오류가 발생했습니다.')
    );
  }
};

export default withProtectedApi(handler); 