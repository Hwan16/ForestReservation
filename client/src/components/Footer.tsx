import { useState } from "react";
import AdminLogin from "./AdminLogin";

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <footer className="bg-neutral-dark text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">아름유아 숲 체험원</h3>
            <p className="text-gray-300 mb-2">자연과 함께하는 특별한 체험</p>
            <p className="text-gray-300">사업자등록번호: 123-45-67890</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">연락처</h3>
            <p className="text-gray-300 mb-2">주소: 경기도 양평군 아름로 123</p>
            <p className="text-gray-300 mb-2">전화: 031-123-4567</p>
            <p className="text-gray-300">이메일: info@areum-forest.kr</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">운영시간</h3>
            <p className="text-gray-300 mb-2">화요일~일요일: 09:00 - 16:00</p>
            <p className="text-gray-300 mb-2">월요일: 휴무</p>
            <p className="text-gray-300 mt-4">
              <a 
                href="#" 
                onClick={openModal}
                className="text-gray-400 hover:text-white"
              >
                관리자 로그인
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} 아름유아 숲 체험원. All rights reserved.</p>
        </div>
      </div>

      {isModalOpen && <AdminLogin onClose={() => setIsModalOpen(false)} />}
    </footer>
  );
};

export default Footer;
