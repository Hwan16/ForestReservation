-- 기존 테이블이 있으면 삭제
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "reservations";
DROP TABLE IF EXISTS "availability";

-- users 테이블 생성
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "is_admin" BOOLEAN NOT NULL DEFAULT FALSE
);

-- reservations 테이블 생성
CREATE TABLE "reservations" (
  "id" SERIAL PRIMARY KEY,
  "reservation_id" TEXT NOT NULL UNIQUE,
  "date" DATE NOT NULL,
  "time_slot" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "inst_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "participants" INTEGER NOT NULL,
  "desired_activity" TEXT NOT NULL,
  "parent_participation" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- availability 테이블 생성
CREATE TABLE "availability" (
  "id" SERIAL PRIMARY KEY,
  "date" DATE NOT NULL,
  "time_slot" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 30,
  "reserved" INTEGER NOT NULL DEFAULT 0,
  "available" BOOLEAN DEFAULT TRUE
);

-- 복합 인덱스 생성 (날짜 + 시간대)
CREATE UNIQUE INDEX "availability_date_time_slot_idx" ON "availability" ("date", "time_slot");
CREATE INDEX "reservations_date_idx" ON "reservations" ("date");

-- 기본 관리자 계정 생성 (비밀번호: admin123)
INSERT INTO "users" ("username", "password", "is_admin") 
VALUES ('admin', 'admin123', TRUE);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "availability" ENABLE ROW LEVEL SECURITY;

-- 관리자용 정책 (모든 접근 허용)
CREATE POLICY "Admin can do anything" ON "users"
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM users WHERE is_admin = TRUE));

CREATE POLICY "Admin can do anything" ON "reservations"
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM users WHERE is_admin = TRUE));

CREATE POLICY "Admin can do anything" ON "availability"
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM users WHERE is_admin = TRUE));

-- 사용자용 정책 (일반 사용자는 예약만 가능)
CREATE POLICY "Anyone can read availability" ON "availability"
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reservations" ON "reservations"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own reservations" ON "reservations"
  FOR SELECT USING (true); 