# 숲 체험 프로그램 예약 시스템 - 개발 가이드

이 문서는 숲 체험 프로그램 예약 시스템의 개발자를 위한 가이드입니다. 프로젝트 설정부터 주요 컴포넌트 설명까지 개발에 필요한 정보를 제공합니다.

## 목차
1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [주요 컴포넌트](#주요-컴포넌트)
4. [API 구조](#api-구조)
5. [데이터베이스](#데이터베이스)
6. [인증 시스템](#인증-시스템)
7. [배포 가이드](#배포-가이드)
8. [테스트](#테스트)
9. [개발 워크플로우](#개발-워크플로우)

## 개발 환경 설정

### 기본 요구사항
- Node.js v18.x 이상
- npm v9.x 이상
- Supabase 계정

### 로컬 개발 환경 설정

1. 저장소 클론
   ```bash
   git clone https://github.com/Hwan16/ForestReservation.git
   cd ForestReservation
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   ```bash
   cp .env.example .env.local
   # .env.local 파일을 편집하여 필요한 값들을 설정합니다
   ```

4. Supabase 설정
   - Supabase 프로젝트 생성
   - 스키마를 Supabase에 마이그레이션:
     ```bash
     npm run db:push
     ```

5. 개발 서버 실행
   ```bash
   npm run dev
   ```

6. 브라우저에서 `http://localhost:5000` 접속

### 디버깅 모드로 실행
```bash
npm run dev:debug
```

### Vercel 개발 환경 실행
```bash
npm run dev:vercel
```

## 프로젝트 구조

```
/
├── api/             # API 라우트 (Vercel 서버리스 함수)
│   ├── auth/        # 인증 관련 API 엔드포인트
│   ├── reservations/ # 예약 관련 API 엔드포인트
│   ├── availability/ # 예약 가능 상태 관련 API 엔드포인트
│   └── admin/       # 관리자 기능 API 엔드포인트
├── client/          # 프론트엔드 코드
│   ├── public/      # 정적 파일
│   └── src/         # 소스 코드
│       ├── components/ # React 컴포넌트
│       ├── pages/      # 페이지 컴포넌트
│       ├── hooks/      # 커스텀 React 훅
│       ├── lib/        # 유틸리티 함수 및 라이브러리
│       ├── types.ts    # 타입 정의
│       └── App.tsx     # 메인 애플리케이션 컴포넌트
├── lib/             # 공유 라이브러리 코드
│   ├── db.ts        # 데이터베이스 접근 함수
│   ├── supabase.ts  # Supabase 클라이언트 설정
│   ├── db-helper.ts # 데이터베이스 헬퍼 함수 (에러 처리, 재시도 로직)
│   └── middleware.ts # API 미들웨어 (인증, 로깅 등)
├── server/          # 백엔드 서버 코드
│   └── index.ts     # Express 서버 진입점
├── shared/          # 프론트엔드와 백엔드에서 공유하는 코드
│   └── schema.ts    # 데이터베이스 스키마 및 Zod 검증 스키마
└── test/            # 테스트 코드
```

## 주요 컴포넌트

### Calendar 컴포넌트
- 위치: `client/src/components/Calendar.tsx`
- 기능: 예약 가능 날짜를 시각적으로 표시
- 주요 속성:
  - `selectedDate`: 현재 선택된 날짜
  - `onDateSelect`: 날짜 선택 시 호출되는 콜백 함수
  - `availability`: 각 날짜별 예약 가능 상태 정보

### ReservationForm 컴포넌트
- 위치: `client/src/components/ReservationForm.tsx`
- 기능: 사용자 예약 정보 입력 폼
- 사용 기술: React Hook Form, Zod
- 주요 필드: 이름, 연락처, 단체명, 인원수, 요청사항

### AdminReservationView 컴포넌트
- 위치: `client/src/components/AdminReservationView.tsx`
- 기능: 관리자가 예약 현황을 보고 관리할 수 있는 뷰
- 주요 기능: 예약 조회, 상태 변경, 취소, 상세 정보 확인

### TimeSelection 컴포넌트
- 위치: `client/src/components/TimeSelection.tsx`
- 기능: 오전/오후 시간대 선택 컴포넌트
- 상태:
  - `morning`: 오전 시간대 예약 가능 여부 
  - `afternoon`: 오후 시간대 예약 가능 여부

## API 구조

### 인증 API
- `POST /api/auth/login`: 로그인
- `POST /api/auth/register`: 회원가입
- `POST /api/auth/logout`: 로그아웃
- `GET /api/auth/me`: 현재 사용자 정보 조회
- `POST /api/auth/reset-password`: 비밀번호 재설정 요청
- `POST /api/auth/reset-password-confirm`: 비밀번호 재설정 확인
- `POST /api/auth/update-password`: 비밀번호 변경

### 예약 API
- `GET /api/reservations`: 모든 예약 조회
- `GET /api/reservations/:id`: 특정 예약 조회
- `POST /api/reservations`: 새로운 예약 생성
- `PUT /api/reservations/:id`: 예약 정보 업데이트
- `DELETE /api/reservations/:id`: 예약 취소
- `GET /api/reservations/user`: 현재 로그인한 사용자의 예약 조회

### 예약 가능 상태 API
- `GET /api/availability?date=YYYY-MM-DD`: 특정 날짜의 예약 가능 상태 조회
- `GET /api/availability/month?year=YYYY&month=MM`: 월별 예약 가능 상태 조회
- `PUT /api/availability/:id`: 예약 가능 상태 업데이트
- `POST /api/availability/reset`: 예약 가능 상태 초기화

### 관리자 API
- `GET /api/admin/users`: 모든 사용자 조회
- `PUT /api/admin/users/:id`: 사용자 정보 수정
- `DELETE /api/admin/users/:id`: 사용자 삭제
- `GET /api/admin/dashboard`: 대시보드 데이터 조회
- `POST /api/admin/settings`: 시스템 설정 업데이트

## 데이터베이스

### Supabase 연동
- `lib/supabase.ts`: Supabase 클라이언트 설정
- 환경 변수:
  - `SUPABASE_URL`: Supabase 프로젝트 URL
  - `SUPABASE_KEY`: Supabase 서비스 키 (서버 측)
  - `VITE_SUPABASE_URL`: 클라이언트용 Supabase URL
  - `VITE_SUPABASE_KEY`: 클라이언트용 Supabase 공개 키

### 스키마 정의
- `shared/schema.ts`에 Drizzle ORM을 사용하여 정의
- 주요 테이블:
  - `users`: 사용자 계정 정보
  - `reservations`: 예약 정보
  - `availability`: 날짜별 예약 가능 상태
  - `files`: 첨부 파일 정보

### 데이터베이스 함수
- `lib/db.ts`에 정의된 CRUD 함수:
  - 사용자 관련: `createUser`, `getUserById`, `updateUser` 등
  - 예약 관련: `createReservation`, `getReservationById`, `updateReservation` 등
  - 예약 가능 상태 관련: `getAvailabilityByDate`, `updateAvailability` 등

### 에러 처리 및 재시도 로직
- `lib/db-helper.ts`에 정의:
  - `withRetry`: 일시적인 데이터베이스 오류 발생 시 자동 재시도
  - `transaction`: 여러 연산을 트랜잭션으로 처리

## 인증 시스템

### Supabase Auth
- JWT 기반 인증
- 토큰 관리:
  - 로컬 스토리지에 저장
  - API 요청 시 Authorization 헤더에 포함

### 권한 제어
- `lib/middleware.ts`에 정의:
  - `withAuth`: 인증된 사용자만 접근 가능
  - `withAdmin`: 관리자 권한을 가진 사용자만 접근 가능

### 사용자 계정 관리
- 회원가입: 이메일, 비밀번호, 사용자명 필수
- 로그인: 이메일과 비밀번호로 인증
- 비밀번호 재설정: 이메일 기반 재설정 링크 전송

## 배포 가이드

### Vercel 배포
1. Vercel CLI 설치 및 로그인
   ```bash
   npm install -g vercel
   npm run vercel:login
   npm run vercel:link
   ```

2. 환경 변수 설정
   ```bash
   npm run vercel:env:pull
   ```

3. 프로덕션 빌드 테스트
   ```bash
   npm run build
   ```

4. Vercel에 배포
   ```bash
   vercel --prod
   ```

### 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `EMAIL_FROM`
- `EMAIL_SERVER`
- `EMAIL_PORT`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`

## 테스트

### 단위 테스트 실행
```bash
npm test
```

### 테스트 커버리지 확인
```bash
npm run test:coverage
```

### 테스트 작성 가이드
- `test/` 디렉토리에 테스트 파일 작성
- 파일명 규칙: `*.test.ts` 또는 `*.test.tsx`
- Jest와 React Testing Library 사용

## 개발 워크플로우

### 브랜치 전략
- `main`: 프로덕션 코드
- `dev`: 개발 중인 코드
- 기능 개발: `feature/기능명`
- 버그 수정: `fix/버그명`

### 코드 품질 관리
- 린팅: `npm run lint`
- 코드 포맷팅: Prettier 사용
- 타입 체크: `npm run check`

### 프로젝트 빌드
```bash
npm run build
```

### 기여 가이드
1. 이 저장소를 포크합니다
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치를 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다 