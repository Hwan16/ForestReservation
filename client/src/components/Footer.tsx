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
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">연락처</h3>
            <p className="text-gray-300 mb-2">주소: 인천 남동구 수산동 41-3</p>
            <p className="text-gray-300 mb-2">전화: 010-9335-9207</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">운영시간</h3>
            <p className="text-gray-300 mb-2">월요일~토요일: 09:00 ~ 18:00 (오전/오후반 운영)</p>
            <p className="text-gray-300 mb-2">매주 일요일 휴무</p>
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
