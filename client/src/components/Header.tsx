import { Link } from "wouter";

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary text-3xl mr-2 h-8 w-8"
          >
            <path d="M17 22v-1a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1" />
            <path d="M12 2v10" />
            <path d="M9.17 4a3 3 0 1 0 5.66 0" />
          </svg>
          <h1 className="text-xl md:text-2xl font-bold text-primary-dark">아름유아 숲 체험원</h1>
        </Link>
        <nav className="hidden md:block">
          <ul className="flex space-x-4">
            <li><Link href="/" className="text-neutral-dark hover:text-primary">홈</Link></li>
            <li><a href="#" className="text-neutral-dark hover:text-primary">소개</a></li>
            <li><a href="#" className="text-neutral-dark hover:text-primary">프로그램</a></li>
            <li><Link href="/" className="text-neutral-dark hover:text-primary">예약</Link></li>
            <li><a href="#" className="text-neutral-dark hover:text-primary">문의</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
