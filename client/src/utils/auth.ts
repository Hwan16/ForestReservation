/**
 * 관리자 인증 여부를 확인하는 함수
 * 쿠키에 저장된 adminAuth 값이 true인지 확인합니다.
 */
export const isAuthenticated = (): boolean => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie === 'adminAuth=true') {
      return true;
    }
  }
  return false;
};

/**
 * 관리자 로그아웃 함수
 * adminAuth 쿠키를 삭제합니다.
 */
export const logout = (): void => {
  document.cookie = 'adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};