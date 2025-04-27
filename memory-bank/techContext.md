# Technical Context

## 기술 스택
- Frontend: React 18, TypeScript, TailwindCSS, shadcn/ui
- Backend: Next.js API Routes (Serverless)
- Database: Supabase (PostgreSQL)
- State Management: React Query
- Form Handling: React Hook Form + Zod
- Routing: Wouter
- Date Handling: date-fns
- Authentication: Supabase Auth (JWT)
- Hosting/Deployment: Vercel

## 개발 환경
- Node.js: v20+
- npm: v10+
- Vite: 빌드 도구
- TypeScript: 5.6.3

## 의존성
- UI Components: @radix-ui
- Icons: lucide-react
- Database: @supabase/supabase-js
- Validation: zod
- ORM: Drizzle ORM (for PostgreSQL)

## 도구
- VSCode
- ESLint
- Prettier
- Git

## 데이터베이스 마이그레이션
- SQLite에서 Supabase(PostgreSQL)로 마이그레이션 완료
- Drizzle ORM으로 스키마 정의 및 타입 생성
- PostgreSQL 특화 기능(RLS, Functions 등) 활용
- Supabase DB 스키마:
  - users: 사용자 및 관리자 계정
  - reservations: 예약 정보
  - availability: 날짜별 예약 가능 상태

## 인증 시스템
- Supabase Auth를 통한 사용자 인증 (JWT 기반)
- 세션 관리: 자동 갱신 및 로컬 스토리지 유지
- 인증 확인: 쿠키 및 Authorization 헤더
- 권한 제어: 
  - withAuth: 일반 인증 필요 API
  - withAdmin: 관리자 권한 필요 API

## 컴포넌트 구조
### Calendar 컴포넌트
- src/components/Calendar.tsx에 위치
- 예약 가능 날짜를 시각적으로 표시하는 컴포넌트
- 주요 함수:
  - `isDateAvailable`: 날짜 선택 가능 여부 결정 (휴무일, 만석 체크)
  - `isHoliday`: 공휴일 및 휴무일(일요일) 체크
  - `formatDate`: 선택한 날짜를 API 요청에 맞게 변환
- 날짜 선택 로직:
  - 월~토요일만 예약 가능 (일요일 휴무)
  - 예약이 있어도 만석이 아니면 선택 가능
  - 각 날짜별 예약 가능 인원수는 API로부터 가져옴

### Supabase 연동
- lib/supabase.ts: Supabase 클라이언트 설정
- lib/db.ts: 기본 CRUD 함수 구현
- lib/db-helper.ts: 에러 처리 및 재시도 로직
- middleware.ts: API 라우트 보호 및 인증 처리