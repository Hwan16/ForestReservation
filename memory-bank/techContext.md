# Technical Context

## 기술 스택
- Frontend: React 18, TypeScript, TailwindCSS, shadcn/ui
- Backend: Node.js, Express
- Database: SQLite3 (with better-sqlite3)
- State Management: React Query
- Form Handling: React Hook Form + Zod
- Routing: Wouter
- Date Handling: date-fns

## 개발 환경
- Node.js: v20+
- npm: v10+
- Vite: 빌드 도구
- TypeScript: 5.6.3

## 의존성
- UI Components: @radix-ui
- Icons: lucide-react
- Session: express-session + memorystore
- Validation: zod
- ORM: Drizzle (일부 사용)

## 도구
- VSCode
- ESLint
- Prettier
- Git

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

### 예약 가능 날짜 처리
- 일요일: 항상 휴무 (isHoliday 함수에서 확인)
- 월~토요일: 예약 가능 (이전에는 토요일도 불가능했음)
- 예약 상태 표시:
  - 예약 불가능: 회색
  - 예약 가능: 녹색
  - 선택된 날짜: 진한 녹색