import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

// Reservations table
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  reservationId: text("reservation_id").notNull().unique(),
  date: date("date").notNull(),
  timeSlot: text("time_slot").notNull(), // "morning" or "afternoon"
  name: text("name").notNull(), // 어린이집/유치원 이름
  instName: text("inst_name").notNull(), // 원장님/선생님 성함 
  phone: text("phone").notNull(),
  email: text("email"),
  participants: integer("participants").notNull(),
  desiredActivity: text("desired_activity").notNull(), // "all" or "experience"
  parentParticipation: text("parent_participation").notNull(), // "yes" or "no"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Files table to store file metadata
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(), // Supabase storage path
  filename: text("filename").notNull(), // Original filename
  contentType: text("content_type").notNull(), // MIME type
  size: integer("size").notNull(), // File size in bytes
  url: text("url").notNull(), // Public URL
  relatedId: text("related_id"), // ID of related entity (e.g., reservation ID)
  relatedType: text("related_type"), // Type of related entity (e.g., "reservation")
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Availability table to track available slots
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  timeSlot: text("time_slot").notNull(), // "morning" or "afternoon"
  capacity: integer("capacity").notNull().default(30),
  reserved: integer("reserved").notNull().default(0),
  available: boolean("available").default(true), // 예약 가능 여부 (관리자가 마감 설정 가능)
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertReservationSchema = createInsertSchema(reservations);
export const insertAvailabilitySchema = createInsertSchema(availability);
export const insertFileSchema = createInsertSchema(files);

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

// Extended schemas for validation
export const createReservationSchema = z.object({
  date: z.string(),
  timeSlot: z.enum(["morning", "afternoon"]),
  name: z.string().min(1, "어린이집/유치원 이름은 필수 입력 항목입니다."),
  instName: z.string().min(1, "원장님/선생님 성함은 필수 입력 항목입니다."),
  phone: z.string().min(1, "연락처는 필수 입력 항목입니다."),
  participants: z.number({
    required_error: "인원수는 필수 입력 항목입니다.",
    invalid_type_error: "인원수는 숫자로 입력해야 합니다."
  }).min(1, "최소 1명 이상이어야 합니다.").max(30, "최대 30명까지 예약 가능합니다."),
  desiredActivity: z.enum(["all", "experience"], {
    required_error: "희망 활동을 선택해주세요.",
    invalid_type_error: "잘못된 활동 유형입니다."
  }),
  parentParticipation: z.enum(["yes", "no"], {
    required_error: "학부모 참여 여부를 선택해주세요."
  }),
});

// 로그인 스키마
export const loginSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요."),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다.")
});

// 회원가입 스키마
export const registerSchema = z.object({
  username: z.string().min(3, "사용자 이름은 최소 3자 이상이어야 합니다."),
  email: z.string().email("유효한 이메일 주소를 입력해주세요."),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
  passwordConfirm: z.string().min(6, "비밀번호 확인은 최소 6자 이상이어야 합니다.")
}).refine(data => data.password === data.passwordConfirm, {
  message: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
  path: ["passwordConfirm"]
});

// 비밀번호 재설정 요청 스키마
export const resetPasswordRequestSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요.")
});

// 비밀번호 재설정 스키마
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
  passwordConfirm: z.string().min(6, "비밀번호 확인은 최소 6자 이상이어야 합니다.")
}).refine(data => data.password === data.passwordConfirm, {
  message: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
  path: ["passwordConfirm"]
});

// 파일 스키마
export const fileSchema = z.object({
  filename: z.string().min(1, "파일 이름은 필수 입력 항목입니다."),
  contentType: z.string().min(1, "파일 타입은 필수 입력 항목입니다."),
  size: z.number().min(1, "파일 크기는 1바이트 이상이어야 합니다.").max(10485760, "파일 크기는 10MB 이하여야 합니다."),
});
