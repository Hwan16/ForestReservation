# 보안 체크리스트

## 인증 및 인가

### 사용자 인증
- [ ] Supabase Auth 설정이 올바르게 구성되었는지 확인
- [ ] 비밀번호 정책이 적절한지 확인 (최소 길이, 복잡성 요구사항)
- [ ] 비밀번호 재설정 프로세스가 안전하게 구현되었는지 확인
- [ ] 인증 토큰 유효 기간이 적절하게 설정되었는지 확인

### 권한 제어
- [ ] API 엔드포인트에 적절한 권한 검사가 적용되었는지 확인
- [ ] 관리자/일반 사용자 권한 분리가 올바르게 구현되었는지 확인
- [ ] Supabase RLS(Row Level Security)가 올바르게 설정되었는지 확인
- [ ] 사용자가 자신의 데이터만 접근할 수 있도록 제한되었는지 확인

## 데이터 보안

### 민감 데이터 처리
- [ ] 개인 식별 정보(PII)가 적절하게 처리되는지 확인
- [ ] 환경 변수에 저장된 비밀 키가 노출되지 않는지 확인
- [ ] 로그에 민감한 정보가 기록되지 않는지 확인
- [ ] 클라이언트에 전송되는 데이터가 필요한 정보만 포함하는지 확인

### 입력 검증
- [ ] 모든 사용자 입력이 서버 측에서 검증되는지 확인
- [ ] API 요청 본문이 Zod 스키마로 검증되는지 확인
- [ ] SQL 인젝션 방지 대책이 있는지 확인 (Drizzle ORM 사용으로 대부분 방지됨)
- [ ] XSS 공격 방지 대책이 있는지 확인

## 통신 보안

### HTTPS
- [ ] 모든 통신이 HTTPS를 통해 이루어지는지 확인
- [ ] 적절한 SSL/TLS 설정이 적용되었는지 확인
- [ ] HTTP Strict Transport Security(HSTS) 헤더가 설정되었는지 확인

### API 보안
- [ ] API 속도 제한(rate limiting)이 구현되었는지 확인
- [ ] CORS 설정이 적절하게 구성되었는지 확인
- [ ] API 요청에 대한 로깅과 모니터링이 구현되었는지 확인

## 인프라 보안

### Supabase 보안 설정
- [ ] Supabase 프로젝트의 보안 설정이 검토되었는지 확인
- [ ] 데이터베이스 접근이 필요한 IP로 제한되었는지 확인
- [ ] 적절한 백업 정책이 설정되었는지 확인

### Vercel 보안 설정
- [ ] 환경 변수가 안전하게 관리되는지 확인
- [ ] 민감한 정보가 클라이언트 측 코드에 노출되지 않는지 확인
- [ ] 배포 워크플로우에 보안 검사가 포함되었는지 확인 