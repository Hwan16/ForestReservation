import React, { useEffect } from 'react';
import AdminPage from '@/components/AdminPage';
import { useLocation } from 'wouter';
import { isAuthenticated } from '@/utils/auth';

const AdminDashboard = () => {
  const [_, setLocation] = useLocation();

  // 브라우저 뒤로가기 방지
  useEffect(() => {
    // 뒤로가기 방지 함수
    const preventNavigation = (e: PopStateEvent) => {
      // 뒤로가기 시도 시 관리자 페이지로 유지
      window.history.pushState(null, '', window.location.href);
      
      // 추가 검증: 인증되지 않은 상태라면 로그인 페이지로
      if (!isAuthenticated()) {
        setLocation('/');
      }
    };

    // 브라우저 히스토리에 상태 추가
    window.history.pushState(null, '', window.location.href);
    
    // 뒤로가기 이벤트 리스너 추가
    window.addEventListener('popstate', preventNavigation);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('popstate', preventNavigation);
    };
  }, [setLocation]);

  return <AdminPage />;
};

export default AdminDashboard;