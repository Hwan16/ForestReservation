import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import MemoryStore from "memorystore";
import http from "http";

const app = express();
const SessionStore = MemoryStore(session);

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || "areum-forest-secret",
  resave: false,
  saveUninitialized: false,
  store: new SessionStore({
    checkPeriod: 86400000 // 24시간
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    secure: process.env.NODE_ENV === "production",
    httpOnly: true
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 로깅 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // 에러 핸들링 미들웨어
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    server.listen(port, '0.0.0.0', () => {
      log(`Server running at http://localhost:${port}`);
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Trying port ${port + 1}...`);
        server.listen(port + 1, '0.0.0.0', () => {
          log(`Server running at http://localhost:${port + 1}`);
        });
      } else {
        log(`Error starting server: ${error.message}`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    log(`Fatal error: ${error}`);
    process.exit(1);
  }
})();
