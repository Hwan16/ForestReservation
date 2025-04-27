# Active Context

## 현재 작업 중인 사항
- Vercel 배포를 위한 환경 설정 최적화
- Serverless 함수로 API 라우트 변환
- 관리자 페이지 UI/UX 개선 중
- 전체 예약 마감 API 구현 예정
- 예약 수정 기능 개발 중

## 최근 변경사항
- Supabase Auth로 인증 시스템 마이그레이션 완료
- 에러 처리 및 재시도 로직 구현 (withRetry 함수)
- 기본 쿼리 함수를 Supabase 형식으로 변환
- 데이터베이스 스키마 Supabase에 맞게 변환
- Vercel 배포를 위한 데이터베이스 마이그레이션 시작 (SQLite → Supabase/PostgreSQL)
- 알리고 SMS API 연동으로 예약 완료 시 관리자 알림 기능 구현
- AdminReservationView 컴포넌트에서 데이터 새로고침 버튼 제거
- TimeSelection 컴포넌트에서 데이터 새로고침 버튼 제거
- 예약 마감 기능에 available 필드 추가
- 일요일 예약 불가 로직 구현
- 관리자 인증 시스템 보완
- 모바일 친화적 UI 개발 완료
- 마이페이지 예약 검색 API 구현
- 체험 프로그램 페이지 완전 개편 (계절별 구분 및 소개 섹션 추가)
- 토요일 예약 가능하도록 코드 수정 (월~토 모두 예약 가능)
- Calendar 컴포넌트 isDateAvailable 함수 개선 (availabilities 없을 때도 토요일 예약 가능)
- 지난 날짜는 자동으로 예약 불가능하도록 기능 개선

## 다음 단계
1. Vercel 배포 환경 설정 완료
2. Supabase Storage를 이용한 이미지 업로드 기능 구현
3. 전체 예약 마감 API 구현
4. 관리자 페이지 UI/UX 개선 완료
5. 예약 수정 기능 완성
6. 에러 처리 및 검증 강화
7. 체험 프로그램 페이지에 실제 이미지 추가

## 중요 결정사항
- Supabase(PostgreSQL) 데이터베이스로 전환
- JWT 기반 Supabase Auth 사용 결정
- Vercel 플랫폼에 배포하기로 결정
- Serverless 아키텍처로 전환
- React + TypeScript 프론트엔드 스택
- 관리자 페이지에서 예약 정보 실시간 갱신 기능 추가
- 프로그램 페이지 UI를 전체/정규/특별 구분에서 계절별(봄-여름/가을-겨울) 구분으로 변경
- 알리고 SMS API를 활용한 관리자 알림 시스템 구현