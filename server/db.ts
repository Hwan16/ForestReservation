import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT || 5432}/${process.env.DATABASE_NAME}`;

// Vercel 환경에서는 WebSocket을 사용하지 않음
if (process.env.VERCEL === '1') {
  neonConfig.webSocketConstructor = undefined;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  console.log("[DB] Configured for Vercel serverless environment");
}

// 연결 풀 옵션 설정
const connectionOptions = {
  max: 10, // 최대 연결 수
  idle_timeout: 20, // 유휴 연결 시간(초)
  connect_timeout: 10, // 연결 시간 초과(초)
  prepare: false, // 서버리스 환경에서는 준비된 문 사용하지 않음
};

// 데이터베이스 연결 클라이언트 생성
let client: ReturnType<typeof postgres>;
try {
  client = postgres(databaseUrl, connectionOptions);
  console.log("[DB] Database connection initialized");
} catch (error) {
  console.error("[DB] Failed to initialize database connection:", error);
  throw error;
}

// Drizzle ORM 인스턴스 생성
export const db = drizzle(client, { schema });

// 연결 테스트
export async function testConnection() {
  try {
    const result = await client`SELECT NOW()`;
    console.log("[DB] Connection test successful:", result[0]?.now);
    return true;
  } catch (error) {
    console.error("[DB] Connection test failed:", error);
    return false;
  }
}

// 애플리케이션 종료 시 데이터베이스 연결 종료
process.on('SIGTERM', async () => {
  console.log("[DB] SIGTERM received, closing database connections");
  try {
    await client.end();
    console.log("[DB] Database connections closed");
  } catch (err) {
    console.error("[DB] Error closing database connections:", err);
  } finally {
    process.exit(0);
  }
});
