import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
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

// Availability table to track available slots
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  timeSlot: text("time_slot").notNull(), // "morning" or "afternoon"
  capacity: integer("capacity").notNull().default(30),
  reserved: integer("reserved").notNull().default(0),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true });
export const insertAvailabilitySchema = createInsertSchema(availability).omit({ id: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

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

export const loginSchema = z.object({
  username: z.string().min(1, "사용자 이름은 필수 입력 항목입니다."),
  password: z.string().min(1, "비밀번호는 필수 입력 항목입니다.")
});
