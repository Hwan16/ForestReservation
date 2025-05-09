import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { generateReservationId } from "../client/src/lib/utils";
import { createReservationSchema, loginSchema, reservations } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq, asc } from "drizzle-orm";
import { db } from "./db";

// Create memory store for sessions
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "areum-forest-secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // Clear expired sessions every 24h
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Helper middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "인증이 필요합니다." });
  };

  // Initialize with default admin user if not exists
  const initAdminUser = async () => {
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminUser = await storage.getUserByUsername(adminUsername);
    
    if (!adminUser) {
      await storage.createUser({
        username: adminUsername,
        password: process.env.ADMIN_PASSWORD || "admin123",
        isAdmin: true,
      });
      console.log("Admin user created.");
    }
  };
  
  await initAdminUser();

  // Initialize sample availability data
  const initAvailability = async (reset = false) => {
    const today = new Date();
    const availabilities = await storage.getAllAvailabilities();
    
    if (availabilities.length === 0 || reset) {
      // Create availability for the next 365 days (1년)
      for (let i = 0; i < 365; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        
        // Skip Sundays (closed day)
        if (date.getDay() === 0) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        console.log("Creating availability for:", dateStr, "day:", date.getDay());
        
        await storage.createAvailability({
          date: dateStr,
          timeSlot: "morning",
          capacity: 99999, // 실제로는 무제한 (매우 큰 숫자)
          reserved: 0,
        });
        
        await storage.createAvailability({
          date: dateStr,
          timeSlot: "afternoon",
          capacity: 99999, // 실제로는 무제한 (매우 큰 숫자)
          reserved: 0,
        });
      }
      console.log("Sample availability data created.");
    }
  };
  
  await initAvailability();
  
  // API to reset availability data (임시: 인증 없이 사용 가능)
  app.delete("/api/availability/reset", async (req, res) => {
    try {
      // 먼저 모든 예약 삭제
      const allReservations = await storage.getAllReservations();
      for (const reservation of allReservations) {
        await storage.deleteReservation(reservation.id);
      }
      
      // 모든 가용성 데이터 삭제 (MemStorage에서는 직접 구현되어 있지 않으므로 storage 객체를 통해 처리)
      const allAvailabilities = await storage.getAllAvailabilities();
      for (const availability of allAvailabilities) {
        // 현재는 API가 없으므로 직접 처리하지 않음
      }
      
      // 가용성 데이터 새로 초기화
      await initAvailability(true);
      
      return res.status(200).json({ message: "모든 예약 및 가용성 데이터가 초기화되었습니다." });
    } catch (error) {
      return res.status(500).json({ message: "데이터 초기화 중 오류가 발생했습니다." });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
      }
      
      // Set session data
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;
      
      return res.status(200).json({ message: "로그인 성공" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다." });
      }
      return res.status(200).json({ message: "로그아웃 성공" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      return res.status(500).json({ message: "사용자 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });

  // Availability routes
  app.get("/api/availability/:yearMonth", async (req, res) => {
    try {
      const { yearMonth } = req.params;
      if (!yearMonth.match(/^\d{4}-\d{2}$/)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM" });
      }
      
      const availabilities = await storage.getAvailabilitiesByMonth(yearMonth);
      return res.status(200).json(availabilities);
    } catch (error) {
      return res.status(500).json({ message: "예약 가능 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/availability/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      const availability = await storage.getAvailabilityByDate(date);
      return res.status(200).json(availability);
    } catch (error) {
      return res.status(500).json({ message: "예약 가능 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  // 관리자용 가용성 업데이트 API
  app.patch("/api/availability/update", isAuthenticated, async (req, res) => {
    try {
      const { date, timeSlot, capacity, available } = req.body;
      
      if (!date || !timeSlot || capacity === undefined || available === undefined) {
        return res.status(400).json({ message: "필수 필드가 누락되었습니다." });
      }
      
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({ message: "잘못된 날짜 형식입니다. YYYY-MM-DD 형식을 사용하세요." });
      }
      
      if (timeSlot !== 'morning' && timeSlot !== 'afternoon') {
        return res.status(400).json({ message: "시간대는 'morning' 또는 'afternoon'이어야 합니다." });
      }
      
      if (typeof capacity !== 'number' || capacity < 0) {
        return res.status(400).json({ message: "용량은 0 이상의 숫자여야 합니다." });
      }
      
      // 현재 가용성 확인
      const currentAvailability = await storage.getAvailabilityByDate(date);
      const currentSlot = currentAvailability?.status[timeSlot];
      
      if (!currentSlot) {
        // 가용성 데이터가 없으면 새로 생성
        await storage.createAvailability({
          date,
          timeSlot,
          capacity,
          reserved: 0
        });
      } else {
        // 기존 가용성 업데이트
        await storage.updateAvailability(date, timeSlot, (current) => ({
          ...current,
          capacity,
          // 현재 예약된 수가 새 용량보다 많으면 가용성을 false로 설정
          available: available && current.reserved <= capacity
        }));
      }
      
      // 업데이트된 가용성 반환
      const updatedAvailability = await storage.getAvailabilityByDate(date);
      return res.status(200).json(updatedAvailability);
    } catch (error) {
      return res.status(500).json({ message: "가용성 업데이트 중 오류가 발생했습니다." });
    }
  });

  // Reservation routes
  app.post("/api/reservations", async (req, res) => {
    try {
      const data = createReservationSchema.parse(req.body);
      
      // Check if slot is available
      const dateAvailability = await storage.getAvailabilityByDate(data.date);
      
      if (!dateAvailability) {
        return res.status(400).json({ message: "선택한 날짜는 예약이 불가능합니다." });
      }
      
      const slotStatus = data.timeSlot === "morning" 
        ? dateAvailability.status.morning 
        : dateAvailability.status.afternoon;
      
      // 예약 가능 여부만 확인 (인원수 제한 없음)
      if (!slotStatus.available) {
        return res.status(400).json({ message: "선택한 시간대는 관리자에 의해 예약이 중단되었습니다." });
      }
      
      // 인원수 유효성 검사
      if (data.participants === undefined || data.participants === null || data.participants < 1) {
        return res.status(400).json({ message: "인원수는 최소 1명 이상이어야 합니다." });
      }
      
      // Create reservation
      const reservationId = generateReservationId();
      
      const reservation = await storage.createReservation({
        reservationId,
        date: data.date,
        timeSlot: data.timeSlot,
        name: data.name,
        instName: data.instName,
        phone: data.phone,
        email: null, // 이메일 필드 제거
        participants: data.participants,
        desiredActivity: data.desiredActivity,
        parentParticipation: data.parentParticipation,
        notes: data.notes || null,
        createdAt: new Date().toISOString(),
      });
      
      // Update availability
      await storage.updateAvailability(data.date, data.timeSlot, (current) => ({
        ...current,
        reserved: current.reserved + data.participants,
      }));
      
      return res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "예약 중 오류가 발생했습니다." });
    }
  });

  // 관리자 인증 미들웨어
  const isAdmin = (req: Request, res: Response, next: Function) => {
    const adminPassword = req.cookies.adminAuth;
    if (adminPassword === "1005") {
      return next();
    }
    return res.status(401).json({ message: "관리자 인증이 필요합니다." });
  };

  // 관리자 로그인 라우트
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === "1005") {
      res.cookie("adminAuth", "1005", {
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        httpOnly: true
      });
      return res.json({ message: "로그인 성공" });
    }
    return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });
  });

  // 예약 조회 API에 관리자 인증 미들웨어 적용
  app.get("/api/reservations/all", isAdmin, async (req: Request, res: Response) => {
    try {
      const reservations = await storage.getAllReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "예약 정보를 가져오는데 실패했습니다." });
    }
  });
  
  // 개발용 테스트 API - 인증 없이 모든 예약 조회 가능 (실제 배포 시 제거 필요)
  app.get("/api/reservations/test", async (req, res) => {
    try {
      const reservations = await storage.getAllReservations();
      console.log(`API - /api/reservations/test 호출됨, ${reservations.length}건 반환`);
      return res.status(200).json(reservations);
    } catch (error) {
      console.error("API 오류 - /api/reservations/test:", error);
      return res.status(500).json({ message: "예약 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  // 마이페이지 예약 검색 API
  app.get("/api/reservations/search", async (req, res) => {
    try {
      const { name, phone } = req.query;
      
      if (!name || !phone) {
        return res.status(400).json({ message: "이름과 전화번호를 모두 입력해주세요." });
      }
      
      // 모든 예약 가져오기
      const allReservations = await storage.getAllReservations();
      
      // 이름과 전화번호로 필터링
      const filteredReservations = allReservations.filter(
        reservation => 
          reservation.name === name && 
          reservation.phone === phone
      );
      
      return res.status(200).json(filteredReservations);
    } catch (error) {
      return res.status(500).json({ message: "예약 검색 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/reservations/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const reservation = await storage.getReservationById(id);
      
      if (!reservation) {
        return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
      }
      
      // Delete reservation
      await storage.deleteReservation(id);
      
      // Update availability (decrease reserved count)
      await storage.updateAvailability(
        reservation.date,
        reservation.timeSlot,
        (current) => ({
          ...current,
          reserved: Math.max(0, current.reserved - reservation.participants),
        })
      );
      
      return res.status(200).json({ message: "예약이 성공적으로 삭제되었습니다." });
    } catch (error) {
      return res.status(500).json({ message: "예약 삭제 중 오류가 발생했습니다." });
    }
  });

  // 날짜별 예약 데이터 조회
  app.get('/api/reservations/date/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const reservations = await db
        .select()
        .from(reservations)
        .where(eq(reservations.date, date))
        .orderBy(asc(reservations.timeSlot));

      res.json(reservations);
    } catch (error) {
      console.error('예약 데이터 조회 중 오류 발생:', error);
      res.status(500).json({ error: '예약 데이터를 불러오는 중 오류가 발생했습니다.' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
