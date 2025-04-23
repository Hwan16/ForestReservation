# System Patterns

## 아키텍처
Frontend (React + TypeScript)
↓
API Layer (Express)
↓
Business Logic (Storage Layer)
↓
Database (SQLite)

## 주요 디자인 패턴
1. **MVC Pattern** - 서버 구조
2. **Container/Presenter Pattern** - React 컴포넌트
3. **Singleton Pattern** - Storage 인터페이스
4. **Factory Pattern** - 예약 ID 생성

## 컴포넌트 관계
- Header/Footer: 전역 레이아웃
- Calendar → TimeSelection → ReservationForm → Confirmation: 예약 플로우
- AdminPage → AdminReservationView: 관리자 뷰 계층

## 핵심 구현 경로
1. 예약 플로우: 날짜 선택 → 시간 선택 → 정보 입력 → 확인
2. 관리자 플로우: 로그인 → 대시보드 → 예약 관리