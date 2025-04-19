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
import { createContext, useContext, useState, useEffect } from "react";
import AdminLogin from "@/components/AdminLogin";

// 관리자 인증 컨텍스트 생성
interface AuthContextType {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  showAdminLogin: boolean;
  setShowAdminLogin: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  setIsAdmin: () => {},
  showAdminLogin: false,
  setShowAdminLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

// 관리자 인증이 필요한 라우트를 위한 컴포넌트
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin, setShowAdminLogin } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isAdmin) {
      setShowAdminLogin(true);
      setLocation("/");
    }
  }, [isAdmin, setShowAdminLogin, setLocation]);

  return isAdmin ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/mypage" component={MyPage} />
      <Route path="/program" component={Program} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [_, setLocation] = useLocation();
  
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    setLocation("/admin");
  };

  const handleCloseAdminLogin = () => {
    setShowAdminLogin(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isAdmin, setIsAdmin, showAdminLogin, setShowAdminLogin }}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <AdminLogin 
            isOpen={showAdminLogin} 
            onClose={handleCloseAdminLogin} 
            onSuccess={handleAdminLoginSuccess} 
          />
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
