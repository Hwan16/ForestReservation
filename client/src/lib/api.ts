/**
 * API 요청을 처리하는 유틸리티 함수
 * 
 * 이 파일은 서버 API 요청을 처리하는 함수를 제공합니다.
 */

import { ApiResponse, User, LoginResponse, Reservation, DayAvailability } from '@/types';
import { getAccessToken } from '@/utils/auth';

/**
 * 기본 API 요청 함수
 * @param url API 엔드포인트 URL
 * @param options 요청 옵션
 * @returns API 응답 데이터
 */
export const apiRequest = async <T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    // 인증 토큰 추가
    const token = getAccessToken();
    
    // 헤더 객체 생성
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    // 응답 처리
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        data: null,
        message: data.message || `API 요청 실패: ${response.status}`,
        error: data.error
      };
    }
    
    return data.success !== undefined
      ? data
      : { success: true, data, message: '' };
  } catch (error) {
    console.error('API 요청 중 오류가 발생했습니다:', error);
    return {
      success: false,
      data: null,
      message: (error as Error).message,
      error: (error as Error).stack
    };
  }
};

// 인증 관련 API 함수들

/**
 * 로그인 요청
 * @param email 이메일
 * @param password 비밀번호
 * @returns 로그인 결과 및 사용자 정보
 */
export const login = async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
  return await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

/**
 * 회원가입 요청
 * @param userData 사용자 정보 (이메일, 비밀번호, 사용자명)
 * @returns 회원가입 결과
 */
export const register = async (userData: { 
  email: string; 
  password: string; 
  passwordConfirm: string;
  username: string; 
}): Promise<ApiResponse<User>> => {
  return await apiRequest<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

/**
 * 로그아웃 요청
 * @returns 로그아웃 결과
 */
export const logout = async (): Promise<ApiResponse<null>> => {
  return await apiRequest<null>('/api/auth/logout', {
    method: 'POST'
  });
};

/**
 * 현재 로그인한 사용자 정보 조회
 * @returns 사용자 정보 또는 null (로그인하지 않은 경우)
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  return await apiRequest<User>('/api/auth/me');
};

/**
 * 비밀번호 재설정 이메일 요청
 * @param email 이메일
 * @returns 요청 결과
 */
export const requestPasswordReset = async (email: string): Promise<ApiResponse<null>> => {
  return await apiRequest<null>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

/**
 * 비밀번호 재설정 처리
 * @param token 재설정 토큰
 * @param password 새 비밀번호
 * @param passwordConfirm 새 비밀번호 확인
 * @returns 요청 결과
 */
export const resetPassword = async (
  token: string, 
  password: string, 
  passwordConfirm: string
): Promise<ApiResponse<null>> => {
  return await apiRequest<null>('/api/auth/reset-password-confirm', {
    method: 'POST',
    body: JSON.stringify({ token, password, passwordConfirm })
  });
};

/**
 * 비밀번호 변경 (로그인 상태에서)
 * @param currentPassword 현재 비밀번호
 * @param newPassword 새 비밀번호
 * @returns 요청 결과
 */
export const changePassword = async (
  password: string, 
  newPassword: string
): Promise<ApiResponse<null>> => {
  return await apiRequest<null>('/api/auth/update-password', {
    method: 'POST',
    body: JSON.stringify({ password, newPassword })
  });
};

/**
 * 예약 정보 가져오기
 * @param date 날짜 문자열 (YYYY-MM-DD)
 * @returns 해당 날짜의 예약 목록
 */
export const fetchReservations = async (date: string): Promise<ApiResponse<Reservation[]>> => {
  return await apiRequest<Reservation[]>(`/api/reservations/${date}`);
};

/**
 * 모든 예약 정보 가져오기
 * @returns 모든 예약 목록
 */
export const fetchAllReservations = async (): Promise<ApiResponse<Reservation[]>> => {
  try {
    const response = await apiRequest<Reservation[]>('/api/reservations/all');
    return {
      ...response,
      data: response.data || [] // 데이터가 null이면 빈 배열로 변환
    };
  } catch (error) {
    console.error('모든 예약 조회 중 오류:', error);
    return {
      success: false,
      data: [],
      message: (error as Error).message,
      error: (error as Error).stack
    };
  }
};

/**
 * 특정 달의 가용성 정보 가져오기
 * @param year 연도
 * @param month 월
 * @returns 해당 월의 날짜별 가용성 정보
 */
export const fetchAvailability = async (year: number, month: number): Promise<ApiResponse<DayAvailability[]>> => {
  return await apiRequest<DayAvailability[]>(`/api/calendar/${year}/${month}`);
};

/**
 * 가용성 정보 업데이트
 * @param date 날짜 문자열 (YYYY-MM-DD)
 * @param timeSlot 시간대 (morning 또는 afternoon)
 * @param data 업데이트할 가용성 데이터
 * @returns 업데이트 결과
 */
export const updateAvailability = async (
  date: string,
  timeSlot: string,
  data: { capacity?: number; available?: boolean }
): Promise<ApiResponse<any>> => {
  return await apiRequest<any>('/api/availability/update', {
    method: 'PATCH',
    body: JSON.stringify({
      date,
      timeSlot,
      ...data
    })
  });
};

/**
 * 예약 생성하기
 * @param reservationData 예약 데이터
 * @returns 생성된 예약 정보
 */
export const createReservation = async (reservationData: Omit<Reservation, 'id' | 'reservationId'>): Promise<ApiResponse<Reservation>> => {
  return await apiRequest<Reservation>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(reservationData)
  });
};

/**
 * 예약 삭제하기
 * @param reservationId 예약 ID
 * @returns 삭제 결과
 */
export const deleteReservation = async (reservationId: number | string): Promise<ApiResponse<null>> => {
  return await apiRequest<null>(`/api/reservations/${reservationId}`, {
    method: 'DELETE'
  });
};

/**
 * 예약 수정하기
 * @param reservationId 예약 ID
 * @param reservationData 수정할 예약 데이터
 * @returns 수정된 예약 정보
 */
export const updateReservation = async (
  reservationId: number | string, 
  reservationData: Partial<Reservation>
): Promise<ApiResponse<Reservation>> => {
  return await apiRequest<Reservation>(`/api/reservations/${reservationId}`, {
    method: 'PUT',
    body: JSON.stringify(reservationData)
  });
}; 