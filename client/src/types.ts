/**
 * 애플리케이션에서 사용되는 타입 정의
 */

// 예약 단계
export type Step = "date" | "time" | "info" | "confirmation";

// 예약 시간대
export type TimeSlot = "morning" | "afternoon";

// 예약 정보 인터페이스
export interface Reservation {
  id?: number;
  reservationId?: string;
  date: string;
  timeSlot: TimeSlot;
  name: string;
  instName: string;
  phone: string;
  participants: number;
  desiredActivity?: "all" | "experience";
  parentParticipation?: "yes" | "no";
  notes?: string;
  timestamp?: string;
}

export type AvailabilityStatus = {
  morning: {
    available: boolean;
    capacity: number;
    reserved: number;
  };
  afternoon: {
    available: boolean;
    capacity: number;
    reserved: number;
  };
};

// 날짜별 예약 가능 여부
export interface DayAvailability {
  date: string;
  status: AvailabilityStatus;
  morningAvailable?: boolean;
  afternoonAvailable?: boolean;
  morningCount?: number;
  afternoonCount?: number;
}

// 캘린더 날짜 인터페이스
export interface CalendarDate {
  date: string;
  morningReserved: boolean;
  afternoonReserved: boolean;
}

/**
 * API 응답 표준 형식
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
}

/**
 * 유저 정보 인터페이스
 */
export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

/**
 * 인증 세션 정보
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * 로그인 응답 데이터
 */
export interface LoginResponse {
  user: User;
  session: AuthSession;
}
