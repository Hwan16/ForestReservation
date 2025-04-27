import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware, formatResponse } from '../../lib/middleware';
import { createReservationSchema } from '../../shared/schema';
import { db } from '../../lib/db';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { generateReservationId } from '../../client/src/lib/utils';
import { sendReservationNotification } from '../../lib/smsService';

// POST /api/reservations - 새 예약 생성
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json(formatResponse(false, null, '잘못된 요청 메서드입니다.'));
  }

  try {
    // 예약 데이터 유효성 검증
    const data = createReservationSchema.parse(req.body);

    // 예약 가능한지 확인
    const availability = await db.availability.getByTimeSlot(data.date, data.timeSlot);

    if (!availability) {
      return res.status(404).json(
        formatResponse(false, null, '예약 가능한 시간이 없습니다.')
      );
    }

    // 예약 마감 확인
    if (!availability.available) {
      return res.status(400).json(
        formatResponse(false, null, '해당 시간대는 예약이 마감되었습니다.')
      );
    }

    // 인원 수 확인
    if (availability.capacity < availability.reserved + data.participants) {
      return res.status(400).json(
        formatResponse(false, null, '예약 가능 인원을 초과했습니다.')
      );
    }

    // 예약 ID 생성
    const reservationId = generateReservationId();

    // 예약 생성
    const reservation = await db.reservations.create({
      reservationId,
      date: data.date,
      timeSlot: data.timeSlot,
      name: data.name,
      instName: data.instName,
      phone: data.phone,
      email: req.body.email || null,
      participants: data.participants,
      desiredActivity: data.desiredActivity,
      parentParticipation: data.parentParticipation
    });

    // 가용성 업데이트
    await db.availability.update(data.date, data.timeSlot, {
      reserved: availability.reserved + data.participants
    });

    // SMS 알림 전송 (비동기로 처리)
    try {
      sendReservationNotification({
        date: data.date,
        timeSlot: data.timeSlot as 'morning' | 'afternoon',
        instName: data.instName,
        name: data.name,
        participants: data.participants
      }).catch(error => {
        console.error('SMS 알림 전송 실패:', error);
      });
    } catch (error) {
      console.error('SMS 알림 전송 중 오류:', error);
      // SMS 전송 실패는 예약에 영향을 주지 않음
    }

    // 응답 반환
    return res.status(201).json(
      formatResponse(true, reservation, '예약이 성공적으로 완료되었습니다.')
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }

    console.error('예약 생성 오류:', error);
    return res.status(500).json(
      formatResponse(false, null, '예약 중 오류가 발생했습니다.')
    );
  }
};

export default withApiMiddleware(handler); 