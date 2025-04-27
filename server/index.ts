import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import MemoryStore from "memorystore";
import http from "http";
import path from "path";
import debugLib from "debug";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";

// 환경 변수 로드 - 환경별로 다른 파일 사용
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
const localEnvFile = `.env.${nodeEnv}.local`;

// 로깅 초기화
const debug = debugLib('forest:server');
debug(`Starting server in ${nodeEnv} mode`);
debug(`Loading environment variables from ${envFile} and ${localEnvFile} if they exist`);

// 환경 변수 파일 로드 시도
try {
  const defaultEnv = dotenv.config({ path: path.resolve(process.cwd(), envFile) });
  expand(defaultEnv);
  debug(`Loaded environment variables from ${envFile}`);
  
  try {
    const localEnv = dotenv.config({ path: path.resolve(process.cwd(), localEnvFile) });
    expand(localEnv);
    debug(`Loaded local environment variables from ${localEnvFile}`);
  } catch (err) {
    debug(`No local environment file found at ${localEnvFile}`);
  }
} catch (err) {
  console.warn(`Failed to load environment variables from ${envFile}:`, err);
}

// Vercel 서버리스 환경을 위한 설정
export const isVercel = process.env.VERCEL === '1';
debug(isVercel ? 'Running in Vercel serverless environment' : 'Running in standard environment');

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

// 상태 체크 엔드포인트 추가
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

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

      debug(logLine);
      log(logLine);
    }
  });

  next();
});

// Vercel 서버리스 환경에서 서버 설정
let server: http.Server;

async function setupServer() {
  try {
    debug('Initializing routes');
    server = await registerRoutes(app);

    // 에러 핸들링 미들웨어
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      debug(`Error: ${message}`);
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      debug('Setting up Vite dev server');
      await setupVite(app, server);
    } else {
      debug('Setting up static file serving');
      serveStatic(app);
    }

    // Vercel 환경에서는 listen이 필요 없음
    if (!isVercel) {
      const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
      const host = process.env.HOST || '0.0.0.0';
      
      server.listen(port, host, () => {
        debug(`Server running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
        log(`Server running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
      }).on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          debug(`Port ${port} is already in use. Trying port ${port + 1}...`);
          server.listen(port + 1, host, () => {
            debug(`Server running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port + 1}`);
            log(`Server running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port + 1}`);
          });
        } else {
          debug(`Error starting server: ${error.message}`);
          log(`Error starting server: ${error.message}`);
          process.exit(1);
        }
      });
    }
  } catch (error) {
    debug(`Fatal error: ${error}`);
    log(`Fatal error: ${error}`);
    process.exit(1);
  }
}

// 서버리스 환경을 위한 초기화
debug('Setting up server');
setupServer();

// Vercel 서버리스 함수 호환을 위해 app 객체 export
export default app;
