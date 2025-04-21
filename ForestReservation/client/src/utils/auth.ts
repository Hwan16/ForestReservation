/**
 * 관리자 인증 여부를 확인하는 함수
 * 쿠키 또는 로컬 스토리지에 저장된 adminAuth 값이 true인지 확인합니다.
 */
export const isAuthenticated = (): boolean => {
  // 쿠키를 통한 인증 체크
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie === 'adminAuth=true') {
      console.log("인증됨 (쿠키)");
      return true;
    }
  }
  
  // 로컬 스토리지를 통한 인증 체크 (쿠키가 실패했을 경우 대비)
  const localAuthValue = localStorage.getItem('adminAuth');
  if (localAuthValue === 'true') {
    console.log("인증됨 (로컬 스토리지)");
    return true;
  }
  
  console.log("인증되지 않음");
  return false;
};

/**
 * 관리자 로그아웃 함수
 * adminAuth 쿠키와 로컬 스토리지 항목을 삭제하고 홈 화면으로 이동합니다.
 */
export const logout = (): void => {
  // 쿠키 삭제
  document.cookie = 'adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // 로컬 스토리지 항목 삭제
  localStorage.removeItem('adminAuth');
  
  console.log("로그아웃됨");
  
  // 홈 화면으로 이동
  window.location.href = '/';
};