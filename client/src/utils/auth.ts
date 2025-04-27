import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/lib/api';

/**
 * 인증 토큰을 로컬 스토리지에 저장합니다.
 * @param tokens 액세스 토큰 및 리프레시 토큰 정보
 */
export const saveAuthTokens = (tokens: { 
  accessToken: string; 
  refreshToken: string;
  expiresAt: number;
}) => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('tokenExpiry', tokens.expiresAt.toString());
};

/**
 * 로컬 스토리지에서 인증 토큰을 삭제합니다.
 */
export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('userData');
};

/**
 * 액세스 토큰을 로컬 스토리지에서 가져옵니다.
 * @returns 액세스 토큰 또는 null
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * 리프레시 토큰을 로컬 스토리지에서 가져옵니다.
 * @returns 리프레시 토큰 또는 null
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

/**
 * 현재 인증되어 있는지 확인합니다.
 * @returns 인증 여부
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  const expiry = localStorage.getItem('tokenExpiry');
  
  if (!token || !expiry) {
    return false;
  }
  
  // 토큰 만료 확인
  const expiryTime = parseInt(expiry, 10) * 1000; // 초 -> 밀리초 변환
  return expiryTime > Date.now();
};

/**
 * 현재 사용자가 관리자인지 확인합니다.
 * @returns 관리자 여부
 */
export const isAdmin = (): boolean => {
  const userDataStr = localStorage.getItem('userData');
  if (!userDataStr) {
    return false;
  }
  
  try {
    const userData = JSON.parse(userDataStr);
    return userData.isAdmin === true;
  } catch (error) {
    console.error('사용자 데이터 파싱 오류:', error);
    return false;
  }
};

/**
 * 로그인 처리를 수행합니다.
 * @param email 이메일
 * @param password 비밀번호
 * @returns 로그인 성공 여부와 오류 메시지
 */
export const login = async (
  email: string, 
  password: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiLogin(email, password);
    
    if (response.success && response.data) {
      // 토큰 저장
      saveAuthTokens({
        accessToken: response.data.session.accessToken,
        refreshToken: response.data.session.refreshToken,
        expiresAt: response.data.session.expiresAt
      });
      
      // 사용자 정보 저장
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      
      return { success: true };
    } else {
      return { 
        success: false, 
        message: response.message || '로그인에 실패했습니다.' 
      };
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    return { 
      success: false, 
      message: (error as Error).message || '로그인 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 로그아웃 처리를 수행합니다.
 * @returns 로그아웃 성공 여부
 */
export const logout = async (): Promise<boolean> => {
  try {
    await apiLogout();
    clearAuthTokens();
    return true;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    // 에러가 발생하더라도 클라이언트 측에서는 토큰을 삭제
    clearAuthTokens();
    return false;
  }
};

/**
 * 현재 로그인한 사용자 정보를 가져옵니다.
 * @returns 사용자 정보 또는 null
 */
export const getUser = async () => {
  // 로컬에 저장된 사용자 정보가 있으면 먼저 반환
  const userDataStr = localStorage.getItem('userData');
  if (userDataStr) {
    try {
      return JSON.parse(userDataStr);
    } catch (error) {
      console.error('사용자 데이터 파싱 오류:', error);
    }
  }
  
  // 로컬에 없으면 서버에서 조회
  try {
    const response = await getCurrentUser();
    if (response.success && response.data) {
      localStorage.setItem('userData', JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
  }
  
  return null;
};