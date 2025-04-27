import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, auth } from './supabase';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { createServerSupabaseClient } from './supabase';

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => void | Promise<void>;

export type ApiMiddleware = (
  handler: ApiHandler
) => ApiHandler;

// 표준 응답 포맷 유틸리티
export const formatResponse = (
  success: boolean,
  data: any = null,
  message: string = ''
) => {
  return { success, data, message };
};

// CORS 미들웨어
export const withCors: ApiMiddleware = (handler) => async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // OPTIONS 요청에 대한 응답
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return handler(req, res);
};

// JWT 토큰 추출
const extractToken = (req: NextApiRequest): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 쿠키에서 토큰 확인
  if (req.cookies && req.cookies.sb_auth_token) {
    return req.cookies.sb_auth_token;
  }
  
  return null;
};

// 인증 미들웨어
export const withAuth: ApiMiddleware = (handler) => async (req, res) => {
  try {
    // 1. JWT 토큰 추출
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json(
        formatResponse(false, null, '인증이 필요합니다.')
      );
    }
    
    // 2. JWT 토큰 검증
    const { valid, user } = await auth.verifyToken(token);
    
    if (!valid || !user) {
      return res.status(401).json(
        formatResponse(false, null, '유효하지 않은 인증 토큰입니다.')
      );
    }
    
    // 3. 사용자 정보를 요청 객체에 추가
    (req as any).user = user;
    
    return handler(req, res);
  } catch (error) {
    console.error('인증 오류:', error);
    return res.status(401).json(
      formatResponse(false, null, '인증 처리 중 오류가 발생했습니다.')
    );
  }
};

// 관리자 권한 확인 미들웨어
export const withAdmin: ApiMiddleware = (handler) => async (req, res) => {
  try {
    // 1. 먼저 인증 확인
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json(
        formatResponse(false, null, '인증이 필요합니다.')
      );
    }
    
    // 2. JWT 토큰 검증
    const { valid, user } = await auth.verifyToken(token);
    
    if (!valid || !user) {
      return res.status(401).json(
        formatResponse(false, null, '유효하지 않은 인증 토큰입니다.')
      );
    }
    
    // 3. 관리자 여부 확인
    const isAdmin = user.user_metadata?.is_admin === true;
    
    if (!isAdmin) {
      return res.status(403).json(
        formatResponse(false, null, '관리자 권한이 필요합니다.')
      );
    }
    
    // 4. 사용자 정보를 요청 객체에 추가
    (req as any).user = user;
    (req as any).isAdmin = true;
    
    return handler(req, res);
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    return res.status(403).json(
      formatResponse(false, null, '권한 확인 중 오류가 발생했습니다.')
    );
  }
};

// 에러 핸들링 미들웨어
export const withErrorHandling: ApiMiddleware = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    console.error('API 오류:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatResponse(false, null, fromZodError(error).message)
      );
    }
    
    const statusCode = (error as any).statusCode || 500;
    const message = (error as any).message || '서버 오류가 발생했습니다.';
    
    return res.status(statusCode).json(
      formatResponse(false, null, message)
    );
  }
};

// 모든 미들웨어를 한번에 적용
export const withApiMiddleware = (handler: ApiHandler): ApiHandler => {
  return withCors(withErrorHandling(handler));
};

// 인증이 필요한 API 라우트
export const withProtectedApi = (handler: ApiHandler): ApiHandler => {
  return withCors(withErrorHandling(withAuth(handler)));
};

// 관리자 권한이 필요한 API 라우트
export const withAdminApi = (handler: ApiHandler): ApiHandler => {
  return withCors(withErrorHandling(withAdmin(handler)));
}; 