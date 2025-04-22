import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('forest.db');
export const db = drizzle(sqlite, { schema });

// 데이터베이스 초기화
const initDatabase = () => {
  // users 테이블 생성
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0
    );
  `);

  // reservations 테이블 생성
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      name TEXT NOT NULL,
      inst_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      participants INTEGER NOT NULL,
      desired_activity TEXT NOT NULL,
      parent_participation TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // availability 테이블 생성
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 30,
      reserved INTEGER NOT NULL DEFAULT 0,
      available INTEGER DEFAULT 1
    );
  `);
  
  // available 필드가 없는 경우 추가하는 마이그레이션
  try {
    // 필드 존재 여부 확인
    const checkColumn = sqlite.prepare("PRAGMA table_info(availability)").all();
    const hasAvailableColumn = checkColumn.some((col: any) => col.name === 'available');
    
    if (!hasAvailableColumn) {
      console.log("availability 테이블에 available 필드 추가");
      sqlite.exec("ALTER TABLE availability ADD COLUMN available INTEGER DEFAULT 1");
    }
  } catch (error) {
    console.error("데이터베이스 마이그레이션 중 오류 발생:", error);
  }
};

initDatabase();
