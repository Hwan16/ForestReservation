# Supabase Auth 인증 시스템 마이그레이션 가이드

이 문서는 기존 세션 기반 인증 시스템에서 Supabase Auth로 마이그레이션하는 과정을 설명합니다.

## 개요

Supabase Auth로의 마이그레이션은 다음 단계로 이루어집니다:

1. 기존 사용자 계정 마이그레이션
2. Supabase Auth 통합
3. 프론트엔드 및 백엔드 코드 업데이트
4. 테스트 및 검증

## 1. 기존 사용자 계정 마이그레이션

### 1.1 마이그레이션 실행

Supabase Auth로 사용자를 마이그레이션하려면 다음 스크립트를 실행하세요:

```bash
# 개발 환경에서 실행
NODE_ENV=development node migrate-auth.js

# 프로덕션 환경에서 실행
NODE_ENV=production node migrate-auth.js
```

이 스크립트는 다음 작업을 수행합니다:

- SQLite 데이터베이스에서 모든 사용자 정보 가져오기
- 각 사용자를 Supabase Auth에 등록
- 관리자 사용자에게는 설정된 기본 비밀번호 적용
- 일반 사용자에게는 임시 비밀번호 생성
- 결과 및 임시 비밀번호 로그 파일 생성

### 1.2 임시 비밀번호 처리

마이그레이션 후 생성된 임시 비밀번호 파일(`temp-passwords.json`)을 확인하고 다음 작업을 수행하세요:

- 사용자에게 새 비밀번호로 변경하라는 알림 발송
- 보안을 위해 파일 확인 후 삭제

## 2. Supabase Auth 통합

### 2.1 필요한 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 2.2 Supabase 클라이언트 설정

애플리케이션에 Supabase 클라이언트를 설정하세요:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 3. 코드 업데이트

### 3.1 로그인 기능 업데이트

세션 기반 로그인에서 Supabase Auth 로그인으로 변경하세요:

```typescript
// 기존 세션 기반 로그인
async function login(email, password) {
  // ...세션 기반 로그인 코드...
}

// Supabase Auth 로그인으로 변경
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}
```

### 3.2 사용자 등록 기능 업데이트

```typescript
// Supabase Auth 사용자 등록
async function register(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        role: 'user'
      }
    }
  });
  
  if (error) throw error;
  return data;
}
```

### 3.3 인증 상태 관리 업데이트

```typescript
// Supabase Auth 세션 검사
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// 로그아웃 기능
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### 3.4 API 요청 인증 헤더 업데이트

```typescript
// API 요청에 인증 헤더 추가
async function fetchData(url) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  });
  
  return response.json();
}
```

## 4. 백엔드 인증 미들웨어 업데이트

```typescript
// 인증 미들웨어 업데이트
import { createClient } from '@supabase/supabase-js';

export async function authMiddleware(req, res, next) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증이 필요합니다' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
}
```

## 5. 테스트 및 검증

마이그레이션 후 다음 항목을 테스트하세요:

1. 로그인 기능
2. 사용자 등록
3. 비밀번호 재설정
4. 세션 지속성
5. 권한 기반 접근 제어

다음 테스트 스크립트를 실행하여 인증 시스템을 검증하세요:

```bash
npm run test:auth
```

## 문제 해결

### 일반적인 문제

1. **토큰 만료 오류**
   - Supabase 세션 갱신 로직을 구현하세요.

2. **권한 문제**
   - 사용자 메타데이터에 올바른 역할 정보가 포함되어 있는지 확인하세요.

3. **중복 이메일 오류**
   - 중복된 이메일을 가진 사용자가 있는지 확인하고 해결하세요.

## 마이그레이션 후 작업

1. 모든 사용자에게 비밀번호 재설정 안내 이메일 발송
2. 새로운 인증 시스템에 대한 사용자 가이드 제공
3. 마이그레이션 중 생성된 임시 비밀번호 파일 삭제

이 가이드를 통해 기존 인증 시스템에서 Supabase Auth로 성공적으로 마이그레이션할 수 있습니다. 