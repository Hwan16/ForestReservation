import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AdminDashboard from "@/pages/AdminDashboard";
import MyPage from "@/pages/MyPage";
import Program from "@/pages/Program";
import { useState, useEffect } from "react";
import PasswordModal from "@/components/PasswordModal";

// 쿠키를 통한 인증 상태 관리를 위한 유틸리티 함수
const isAuthenticated = () => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie.startsWith('adminAuth=true')) {
      return true;
    }
  }
  return false;
};

// 관리자 인증이 필요한 라우트를 위한 컴포넌트
function AdminRoute() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [showLogin, setShowLogin] = useState(false);
  const [_, setLocation] = useLocation();

  // 인증 상태 주기적으로 확인
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      if (isAuth !== authenticated) {
        setAuthenticated(isAuth);
      }
    };
    
    // 초기 확인
    checkAuth();
    
    // 1초마다 인증 상태 확인
    const intervalId = setInterval(checkAuth, 1000);
    
    return () => clearInterval(intervalId);
  }, [authenticated]);

  // 인증되지 않았을 때 로그인 모달 표시 및 홈으로 이동
  useEffect(() => {
    if (!authenticated) {
      setShowLogin(true);
      setLocation("/");
    }
  }, [authenticated, setLocation]);

  return (
    <>
      {authenticated ? <AdminDashboard /> : null}
      <PasswordModal
        isOpen={showLogin} 
        onClose={() => {
          setShowLogin(false);
          setLocation("/");
        }}
      />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/mypage" component={MyPage} />
      <Route path="/program" component={Program} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;