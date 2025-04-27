import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

// Supabase URL에서 프로젝트 ID 추출
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectId = projectUrl.match(/https:\/\/([^.]+).supabase.co/)?.[1] || '';

export default {
  schema: "./shared/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Supabase Postgres 연결 정보
    host: process.env.DATABASE_HOST || "localhost", 
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    database: process.env.DATABASE_NAME || "postgres",
    ssl: process.env.NODE_ENV === "production"
  }
} satisfies Config;
