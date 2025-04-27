# System Patterns

## 아키텍처
Frontend (React + TypeScript)
↓
API Layer (Next.js API Routes / Serverless Functions)
↓
Business Logic Layer (DB Helpers)
↓
Database (Supabase / PostgreSQL)

## 인증 아키텍처
Client Request + JWT Token
↓
API Route Middleware (withAuth/withAdmin)
↓
Supabase Auth Token Verification
↓
Protected Resources

## 주요 디자인 패턴
1. **API Middleware Pattern** - 인증 및 권한 관리
2. **Repository Pattern** - 데이터 접근 추상화
3. **Container/Presenter Pattern** - React 컴포넌트
4. **Error Handling Pattern** - 재시도 로직 (withRetry)
5. **Factory Pattern** - 예약 ID 생성

## 데이터 흐름 패턴
1. **API 요청 흐름**:
   - 클라이언트 요청 (JWT 토큰 포함) → 
   - API 미들웨어 (인증/권한 검증) → 
   - 비즈니스 로직 처리 → 
   - Supabase 쿼리 실행 → 
   - 응답 반환

2. **에러 처리 흐름**:
   - 쿼리 실행 → 
   - 에러 발생 시 코드 확인 → 
   - 재시도 가능 여부 판단 → 
   - 재시도 또는 에러 반환

## 컴포넌트 관계
- Header/Footer: 전역 레이아웃
- Calendar → TimeSelection → ReservationForm → Confirmation: 예약 플로우
- AdminPage → AdminReservationView: 관리자 뷰 계층

## 핵심 구현 경로
1. 예약 플로우: 날짜 선택 → 시간 선택 → 정보 입력 → 확인
2. 관리자 플로우: 로그인 → 대시보드 → 예약 관리