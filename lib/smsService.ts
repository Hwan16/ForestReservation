// aligoapi 모듈을 ES 모듈 형식으로 가져옵니다.
import aligoapi from 'aligoapi';

// 알리고 인증 정보
const AuthData = {
  key: process.env.ALIGO_KEY || '', // 발급키
  user_id: process.env.ALIGO_USER_ID || '', // 사용자 아이디
  // testmode_yn: 'Y' // 테스트 모드 사용 여부 ('Y' 또는 'N')
};

/**
 * 예약 완료 시 관리자에게 SMS 알림을 보내는 함수
 * @param reservationData 예약 정보 (날짜, 시간대, 기관명 등)
 * @returns SMS 발송 결과
 */
export async function sendReservationNotification(reservationData: {
  date: string;
  timeSlot: 'morning' | 'afternoon';
  instName: string;
  name: string;
  participants: number;
}) {
  const { date, timeSlot, instName, name, participants } = reservationData;
  
  // 날짜 포맷 변환 (YYYY-MM-DD → M월 D일)
  const dateObj = new Date(date);
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  
  // 시간대 한글 변환
  const timeSlotKr = timeSlot === 'morning' ? '오전반' : '오후반';
  
  // 메시지 내용 구성
  const messageContent = `[숲체험 예약알림] ${month}월 ${day}일, ${timeSlotKr}, ${instName}에서 ${participants}명 예약했습니다. 상세 내용을 확인하세요.`;
  
  // 알리고 SMS 발송 요청 객체
  const req = {
    body: {
      sender: process.env.SMS_SENDER || '', // 발신번호 (인증된 번호여야 함)
      receiver: process.env.SMS_RECEIVER || '', // 관리자 수신번호
      msg: messageContent,
      msg_type: 'SMS' // SMS(단문), LMS(장문)
    },
    headers: {} // aligoapi 라이브러리가 필요로 함
  };
  
  try {
    console.log('[SMS] 알림 발송 시도:', messageContent);
    const result = await aligoapi.send(req, AuthData);
    console.log('[SMS] 발송 결과:', result);
    return { success: true, result };
  } catch (error) {
    console.error('[SMS] 발송 실패:', error);
    return { success: false, error };
  }
} 