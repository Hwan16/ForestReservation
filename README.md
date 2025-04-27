# 숲 체험 프로그램 예약 시스템

숲 체험 프로그램 예약 시스템은 사용자가 쉽게 숲 체험 프로그램을 예약하고 관리할 수 있는 웹 애플리케이션입니다. 관리자는 예약 현황을 확인하고 관리할 수 있으며, 사용자는 편리하게 프로그램을 찾아 예약할 수 있습니다.

![예약 시스템 스크린샷](client/public/screenshot.png)

## 주요 기능

- 🌳 **숲 체험 프로그램 조회**: 날짜별로 가능한 체험 프로그램 조회
- 📅 **예약 관리**: 간편한 예약 생성, 수정, 취소 기능
- 👤 **사용자 계정**: 회원가입, 로그인, 비밀번호 재설정
- 🔍 **가용성 확인**: 달력 뷰로 예약 가능 날짜 확인
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- 🔒 **보안 인증**: Supabase Auth를 이용한 안전한 인증 시스템

## 기술 스택

### 프론트엔드
- **React**: UI 컴포넌트 구축
- **TypeScript**: 타입 안전성을 위한 정적 타입 시스템
- **React Query**: 서버 상태 관리
- **TailwindCSS**: 스타일링
- **DaisyUI**: UI 컴포넌트

### 백엔드
- **Node.js**: 서버 실행 환경
- **Express**: API 엔드포인트 처리
- **Supabase**: 데이터베이스 및 인증
- **Drizzle ORM**: 타입 안전한 데이터베이스 쿼리
- **JWT**: 인증 토큰 관리

### 배포
- **Vercel**: 프론트엔드 및 서버리스 함수 호스팅
- **GitHub Actions**: CI/CD 파이프라인

## 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- npm 9.x 이상
- Supabase 계정

### 설치 및 실행

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
   cp .env.development .env.development.local
   # .env.development.local 파일 편집하여 필요한 값 설정
   ```

4. 개발 서버 실행
   ```bash
   npm run dev
   ```

5. 브라우저에서 `http://localhost:3000` 접속

자세한 개발 가이드는 [DEVELOPMENT.md](DEVELOPMENT.md) 문서를 참조하세요.

## 프로젝트 구조

```
/
├── api/             # API 라우트 (Vercel 서버리스 함수)
├── client/          # 프론트엔드 코드
├── lib/             # 공유 라이브러리 코드
├── server/          # 백엔드 서버 코드
├── shared/          # 프론트엔드와 백엔드에서 공유하는 코드
└── test/            # 테스트 코드
```

## 기여하기

프로젝트에 기여하고 싶으신가요? 다음 단계를 따라 참여하세요:

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치를 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 연락처

김기환 - [kihwan@example.com](mailto:kihwan@example.com)

프로젝트 링크: [https://github.com/Hwan16/ForestReservation](https://github.com/Hwan16/ForestReservation)

## 데이터 마이그레이션 가이드

이 프로젝트는 SQLite에서 Supabase로 데이터베이스를 마이그레이션하는 스크립트를 포함하고 있습니다.

### 준비 사항

1. 마이그레이션 전 환경 변수 설정:
   - `.env.local` 또는 `.env.production` 파일에 다음 변수를 설정하세요:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SQLITE_DB_PATH=./database.sqlite
   DEFAULT_ADMIN_PASSWORD=secure-admin-password
   ```

2. 필요한 패키지 설치:
   ```bash
   npm install @supabase/supabase-js sqlite3 dotenv
   ```

### 마이그레이션 실행

#### 1. 데이터 마이그레이션

모든 데이터(사용자, 예약, 가용성, 파일 메타데이터)를 SQLite에서 Supabase로 마이그레이션합니다:

```bash
node migrate-data.js
```

이 스크립트는 다음을 수행합니다:
- SQLite에서 모든 데이터 가져오기
- Supabase 테이블에 데이터 삽입
- 배치 처리를 통한 대량 데이터 처리
- 마이그레이션 결과 요약 (`migration-summary.json`)

#### 2. 인증 마이그레이션

사용자 계정을 Supabase Auth로 마이그레이션:

```bash
node migrate-auth.js
```

이 스크립트는 다음을 수행합니다:
- SQLite에서 사용자 정보 가져오기
- Supabase Auth에 사용자 계정 생성
- 임시 비밀번호 생성 및 저장
- 마이그레이션 결과 기록 (`auth-migration-results.json`, `temp-passwords.json`)

### 마이그레이션 후 작업

1. **임시 비밀번호 파일 확인 및 삭제**
   - `temp-passwords.json` 파일에 생성된 모든 사용자의 임시 비밀번호가 있습니다.
   - 필요한 정보를 확인한 후 보안을 위해 이 파일을 삭제하세요.

2. **사용자에게 비밀번호 재설정 안내**
   - 모든 사용자에게 첫 로그인 시 비밀번호를 변경하도록 안내하세요.
   - 관리자에게는 기본 관리자 비밀번호를 알려주고 즉시 변경하도록 안내하세요.

3. **데이터 검증**
   - 마이그레이션된 데이터가 정확한지 확인하세요.
   - `migration-summary.json` 파일에서 마이그레이션 결과를 검토하세요.

4. **백업 파일 보관**
   - 원본 SQLite 데이터베이스 파일을 백업으로 보관하세요.

## 주의 사항

- **서비스 롤 키**: 마이그레이션에 사용된 서비스 롤 키는 매우 강력한 권한을 가지고 있습니다. 마이그레이션이 완료되면 이 키를 교체하는 것을 고려하세요.
- **스크립트 실행 환경**: 마이그레이션 스크립트는 프로덕션 환경이 아닌 개발 환경이나 staging 환경에서 실행하는 것이 좋습니다.
- **테스트**: 실제 데이터로 마이그레이션하기 전에 테스트 데이터로 스크립트를 테스트하세요.

---

이 프로젝트는 자연 교육과 환경 보존의 가치를 널리 알리기 위해 개발되었습니다. 🌲 