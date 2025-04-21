/**
 * API 요청을 처리하는 유틸리티 함수
 * 
 * 이 파일은 서버 API 요청을 처리하는 함수를 제공합니다.
 */

/**
 * 기본 API 요청 함수
 * @param url API 엔드포인트 URL
 * @param options 요청 옵션
 * @returns API 응답 데이터
 */
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 요청 중 오류가 발생했습니다:', error);
    throw error;
  }
};

/**
 * 예약 정보 가져오기
 * @param date 날짜 문자열 (YYYY-MM-DD)
 * @returns 해당 날짜의 예약 목록
 */
export const fetchReservations = async (date: string) => {
  return await apiRequest(`/api/reservations/${date}`);
};

/**
 * 특정 달의 가용성 정보 가져오기
 * @param year 연도
 * @param month 월
 * @returns 해당 월의 날짜별 가용성 정보
 */
export const fetchAvailability = async (year: number, month: number) => {
  return await apiRequest(`/api/calendar/${year}/${month}`);
};

/**
 * 예약 생성하기
 * @param reservationData 예약 데이터
 * @returns 생성된 예약 정보
 */
export const createReservation = async (reservationData: any) => {
  return await apiRequest('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(reservationData)
  });
};

/**
 * 예약 삭제하기
 * @param reservationId 예약 ID
 * @returns 삭제 결과
 */
export const deleteReservation = async (reservationId: number | string) => {
  return await apiRequest(`/api/reservations/${reservationId}`, {
    method: 'DELETE'
  });
};

/**
 * 예약 수정하기
 * @param reservationId 예약 ID
 * @param reservationData 수정할 예약 데이터
 * @returns 수정된 예약 정보
 */
export const updateReservation = async (reservationId: number | string, reservationData: any) => {
  return await apiRequest(`/api/reservations/${reservationId}`, {
    method: 'PUT',
    body: JSON.stringify(reservationData)
  });
}; 