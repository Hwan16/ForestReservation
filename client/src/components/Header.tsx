import { Link } from "wouter";
import forestLogo from "../assets/forest-logo.png";

const Header = () => {
  return (
    <>
      <div className="flex justify-end bg-white p-2 border-b">
        <div className="container mx-auto px-4 flex justify-end space-x-4">
          <Link href="/mypage" className="text-neutral-dark hover:text-primary text-sm">마이페이지</Link>
          <Link href="/admin" className="text-neutral-dark hover:text-primary text-sm">관리자</Link>
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
              <h1 className="text-xl md:text-3xl font-bold text-green-700">아름유아 숲 체험원</h1>
            </Link>
          </div>
          <div className="flex items-center">
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li><Link href="/program" className="text-neutral-dark hover:text-primary">체험원 프로그램</Link></li>
                <li><Link href="/" className="text-neutral-dark hover:text-primary">예약하기</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
