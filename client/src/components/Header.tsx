import { Link, useLocation } from "wouter";
import forestLogo from "../assets/forest-logo.png";
import { useState, useEffect } from "react";
import PasswordModal from "./PasswordModal";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // 페이지 로드 시 및 쿠키 변경 시 관리자 상태 확인
  useEffect(() => {
    checkAdminStatus();
  }, []);

  // 관리자 상태 확인 함수
  const checkAdminStatus = () => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith('adminAuth=true')) {
        setIsAdmin(true);
        return;
      }
    }
    setIsAdmin(false);
  };

  const handleAdminClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowPasswordModal(true);
  };

  const handleLogout = () => {
    // 쿠키 삭제
    document.cookie = 'adminAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsAdmin(false);
    
    toast({
      title: '로그아웃',
      description: '관리자 로그아웃 되었습니다.',
    });
    
    // 메인 페이지로 이동
    setLocation('/');
  };

  return (
    <>
      <div className="flex justify-end bg-white p-2 border-b">
        <div className="container mx-auto px-4 flex justify-end space-x-4">
          <Link href="/mypage" className="text-neutral-dark hover:text-primary text-sm">마이페이지</Link>
          {isAdmin ? (
            <a 
              href="#" 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
            >
              로그아웃
            </a>
          ) : (
            <a 
              href="#" 
              onClick={handleAdminClick}
              className="text-neutral-dark hover:text-primary text-sm cursor-pointer"
            >
              관리자
            </a>
          )}
        </div>
      </div>
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-5">
            <Link href="/" className="flex items-center">
              <img 
                src={forestLogo} 
                alt="아름유아 숲 체험원 로고" 
                className="mr-3 h-20 w-auto"
              />
              <h1 className="text-xl md:text-3xl font-bold text-green-700">
                아름유아 숲 체험원
                {isAdmin && (
                  <span className="ml-3 text-sm px-2 py-1 bg-red-600 text-white rounded-md">
                    관리자 모드
                  </span>
                )}
              </h1>
            </Link>
          </div>
          <div className="flex items-center">
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li><Link href="/program" className="text-neutral-dark hover:text-primary">체험원 프로그램</Link></li>
                <li><Link href="/" className="text-neutral-dark hover:text-primary">예약하기</Link></li>
                {isAdmin && (
                  <li><Link href="/admin" className="text-primary hover:text-primary-dark">관리자 대시보드</Link></li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </header>
      
      {/* 관리자 비밀번호 모달 */}
      <PasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </>
  );
};

export default Header;
