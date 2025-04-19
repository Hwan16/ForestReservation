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
import AdminLoginModal from "@/components/AdminLoginModal";

// 쿠키를 통한 인증 상태 관리를 위한 유틸리티 함수
const isAuthenticated = () => {
  return document.cookie.includes('adminAuth=true');
};

// 인증 상태를 설정하는 함수
export const setAuthenticated = (value: boolean) => {
  if (value) {
    // 30분 후 만료되는 쿠키 설정
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + 30 * 60 * 1000); // 30분
    document.cookie = `adminAuth=true; expires=${expiryDate.toUTCString()}; path=/`;
  } else {
    // 쿠키 삭제
    document.cookie = 'adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
};

// 관리자 인증이 필요한 라우트를 위한 컴포넌트
function AdminRoute() {
  const [authenticated, setAuthState] = useState(isAuthenticated());
  const [showLogin, setShowLogin] = useState(false);
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!authenticated) {
      setShowLogin(true);
      setLocation("/");
    }
  }, [authenticated, setLocation]);

  return (
    <>
      {authenticated ? <AdminDashboard /> : null}
      <AdminLoginModal 
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
