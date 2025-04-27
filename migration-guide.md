# SQLite에서 Supabase로의 마이그레이션 가이드

이 문서는 Forest Reservation 애플리케이션의 데이터베이스를 SQLite에서 Supabase로 마이그레이션하는 과정을 설명합니다.

## 사전 준비

마이그레이션을 시작하기 전에 다음 사항을 준비해야 합니다:

1. Supabase 계정 생성 및 새 프로젝트 설정
2. 필요한 환경 변수 확보
3. 백업 실행 (중요)

## 백업 실행

마이그레이션을 시작하기 전에 반드시 백업을 실행하세요:

```bash
# 프로덕션 환경 백업
NODE_ENV=production node backup-script.js

# 개발 환경 백업
NODE_ENV=development node backup-script.js
```

## 마이그레이션 단계

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com/) 계정에 로그인합니다.
2. 새 프로젝트를 생성합니다.
3. 프로젝트의 API 키와 URL을 복사합니다.

### 2. 환경 변수 설정

.env.local 파일을 수정하여 다음 환경 변수를 추가합니다:

```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 데이터베이스 스키마 마이그레이션

1. Supabase에서 필요한 테이블과 스키마를 생성합니다:

```sql
-- users 테이블
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- reservations 테이블
CREATE TABLE reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  reservation_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (reservation_date, time_slot)
);

-- availability 테이블
CREATE TABLE availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  UNIQUE (date, time_slot)
);

-- files 테이블
CREATE TABLE files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  reservation_id UUID REFERENCES reservations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 4. 데이터 마이그레이션

1. 다음 스크립트를 실행하여 데이터를 마이그레이션합니다:

```bash
node migrate-data.js
```

### 5. 애플리케이션 코드 업데이트

1. SQLite 쿼리를 Supabase 쿼리로 변환합니다.
2. 인증 시스템을 Supabase Auth로 변경합니다.
3. API 엔드포인트와 클라이언트 코드를 업데이트합니다.

### 6. 테스트

마이그레이션 후 다음을 테스트합니다:

1. 사용자 인증 (로그인, 등록)
2. 예약 생성 및 조회
3. 가용성 확인
4. 관리자 기능

### 7. 배포

1. 변경 사항을 배포합니다.
2. 모니터링을 설정하여 문제가 발생하는지 확인합니다.

## 롤백 계획

마이그레이션에 문제가 발생할 경우, 다음 단계를 따라 롤백합니다:

1. 롤백 스크립트 실행:

```bash
NODE_ENV=production node rollback-script.js
```

2. Git 브랜치를 백업 브랜치로 되돌립니다:

```bash
git checkout pre-supabase-migration
```

## 마이그레이션 체크리스트

- [ ] Supabase 프로젝트 설정 완료
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 스키마 마이그레이션 완료
- [ ] 데이터 마이그레이션 완료
- [ ] 애플리케이션 코드 업데이트 완료
- [ ] 사용자 인증 테스트 완료
- [ ] 예약 기능 테스트 완료
- [ ] 가용성 확인 테스트 완료
- [ ] 관리자 기능 테스트 완료
- [ ] 배포 완료
- [ ] 모니터링 설정 완료

## 트러블슈팅

### 일반적인 문제

1. **인증 실패**
   - Supabase 키가 올바르게 설정되었는지 확인하세요.
   - 사용자 테이블의 구조가 올바른지 확인하세요.

2. **데이터 불일치**
   - 데이터 마이그레이션 로그를 확인하세요.
   - 누락된 레코드가 있는지 확인하세요.

3. **성능 문제**
   - 인덱스가 올바르게 설정되었는지 확인하세요.
   - 쿼리 최적화를 검토하세요. 