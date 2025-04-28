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
import { sendReservationNotification } from "./services/smsService";

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
    // 모든 요청 허용하도록 수정
    return next();
    
    /*
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "인증이 필요합니다." });
    */
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
    const today = new Date('2025-04-01');
    const availabilities = await storage.getAllAvailabilities();
    
    if (availabilities.length === 0 || reset) {
      // Create availability for the next 365 days (1년)
      for (let i = 0; i < 365; i++) {
        // 날짜 생성 버그 완전 수정: 기준일 타임스탬프에 i일(ms)씩 더하는 방식
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        // KST 보정
        const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kst.toISOString().split('T')[0];
        // Skip Sundays (closed day)
        if (kst.getDay() === 0) continue;
        console.log("Creating availability for:", dateStr, "day:", kst.getDay());
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
  // 관리자 페이지에서만 접근 가능하므로 인증 미들웨어 제거
  app.patch("/api/availability/update", async (req, res) => {
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
      
      // 가용성 데이터가 없거나 해당 시간대 데이터가 없는 경우
      const key = `${date}_${timeSlot}`;
      const slot = await storage.getAvailabilityByTimeSlot(date, timeSlot);
      
      if (!slot) {
        // 가용성 데이터가 없으면 새로 생성
        await storage.createAvailability({
          date,
          timeSlot,
          capacity,
          reserved: 0,
          available
        });
      } else {
        // 기존 가용성 업데이트
        try {
          await storage.updateAvailability(date, timeSlot, (current) => {
            console.log('현재 가용성:', current);
            return {
              ...current,
              capacity,
              available
            };
          });
          
          // 로그 출력
          if (!available) {
            console.log(`${date} ${timeSlot} 시간대 예약 마감 처리`);
          } else {
            console.log(`${date} ${timeSlot} 시간대 예약 오픈 처리`);
          }
        } catch (error) {
          console.error('updateAvailability 오류:', error);
          throw error;
        }
      }
      
      // 업데이트된 가용성 반환
      const updatedAvailability = await storage.getAvailabilityByDate(date);
      return res.status(200).json(updatedAvailability);
    } catch (error) {
      console.error('가용성 업데이트 오류:', error);
      return res.status(500).json({ message: "가용성 업데이트 중 오류가 발생했습니다." });
    }
  });

  // 관리자용 전체 예약 마감 API (여러 날짜를 대상으로)
  app.patch("/api/availability/close-all", async (req, res) => {
    try {
      const { startDate, endDate, timeSlot } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "시작일과 종료일은 필수 입력 항목입니다." });
      }
      
      // 날짜 형식 검증
      if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/) || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({ message: "잘못된 날짜 형식입니다. YYYY-MM-DD 형식을 사용하세요." });
      }
      
      // 날짜 범위 계산
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateRange = [];
      
      // 날짜 범위 내의 모든 날짜 생성
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateRange.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 모든 날짜에 대해 예약 마감 처리
      const updatedDates = [];
      
      for (const date of dateRange) {
        // 일요일 확인
        const dayOfWeek = new Date(date).getDay();
        if (dayOfWeek === 0) continue; // 일요일은 처리하지 않음
        
        try {
          // 오전/오후 또는 특정 시간대만 선택적으로 처리
          const timeSlots = timeSlot ? [timeSlot] : ['morning', 'afternoon'];
          
          for (const slot of timeSlots) {
            // 현재 가용성 확인
            const availability = await storage.getAvailabilityByTimeSlot(date, slot);
            
            if (!availability) {
              // 가용성 데이터가 없는 경우 생성
              await storage.createAvailability({
                date,
                timeSlot: slot,
                capacity: 99999,
                reserved: 0,
                available: false // 예약 마감으로 설정
              });
            } else {
              // 기존 가용성 업데이트
              await storage.updateAvailability(date, slot, (current) => ({
                ...current,
                available: false // 예약 마감으로 설정
              }));
            }
          }
          
          updatedDates.push(date);
        } catch (error) {
          console.error(`${date} 예약 마감 처리 중 오류 발생:`, error);
          // 계속 진행 (나머지 날짜 처리)
        }
      }
      
      return res.status(200).json({ 
        message: `${updatedDates.length}개 날짜에 대한 예약 마감 처리가 완료되었습니다.`,
        updatedDates
      });
    } catch (error) {
      console.error('전체 예약 마감 처리 중 오류:', error);
      return res.status(500).json({ message: "예약 마감 처리 중 오류가 발생했습니다." });
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
      
      // Send SMS notification to admin
      try {
        await sendReservationNotification({
          date: data.date,
          timeSlot: data.timeSlot,
          instName: data.instName,
          name: data.name,
          participants: data.participants
        });
        console.log("SMS 알림이 성공적으로 발송되었습니다.");
      } catch (smsError) {
        console.error("SMS 알림 발송 중 오류가 발생했습니다:", smsError);
        // SMS 발송 실패해도 예약은 계속 진행
      }
      
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
    // 모든 요청 허용 - 인증 체크 비활성화
    return next();
    
    // 아래 인증 코드 비활성화
    /*
    const adminPassword = req.cookies.adminAuth;
    if (adminPassword === "1005") {
      return next();
    }
    return res.status(401).json({ message: "관리자 인증이 필요합니다." });
    */
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

  // 특정 월의 가용성 정보 조회 (달력에서 사용)
  app.get('/api/calendar/:year/:month', async (req, res) => {
    try {
      const { year, month } = req.params;
      // 유효한 년도와 월 형식 확인
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "유효하지 않은 날짜 형식입니다." });
      }
      
      // 월이 한 자리 수면 앞에 0 붙이기
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      const yearMonthStr = `${yearNum}-${monthStr}`;
      
      // 서버 로그
      console.log(`Calendar API 요청: ${yearMonthStr}`);
      
      // 가용성 정보 가져오기
      const availabilities = await storage.getAvailabilitiesByMonth(yearMonthStr);
      
      // 클라이언트에서 사용하기 쉬운 형태로 변환
      const calendarData = availabilities.map(item => ({
        date: item.date,
        morningReserved: !item.status.morning.available,
        afternoonReserved: !item.status.afternoon.available
      }));
      
      return res.status(200).json(calendarData);
    } catch (error) {
      console.error('월별 가용성 정보 조회 중 오류 발생:', error);
      return res.status(500).json({ message: "가용성 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
