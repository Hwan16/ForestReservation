import { Link } from "wouter";

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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-green-600 text-3xl mr-2 h-8 w-8"
              >
                <path d="M17 22v-1a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1" />
                <path d="M12 2v10" />
                <path d="M9.17 4a3 3 0 1 0 5.66 0" />
              </svg>
              <h1 className="text-xl md:text-2xl font-bold text-green-700">아름유아 숲 체험원</h1>
            </Link>
            <Link href="/" className="text-red-600 px-4 py-2 rounded bg-red-100 hover:bg-red-200 font-medium">
              실시간 예약
            </Link>
          </div>
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li><Link href="/program" className="text-neutral-dark hover:text-primary">아름 유아숲 체험원 프로그램</Link></li>
              <li><Link href="/" className="text-neutral-dark hover:text-primary">예약하기</Link></li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
