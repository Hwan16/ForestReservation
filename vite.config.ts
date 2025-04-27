import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Vercel 배포 환경 감지
const isVercel = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [
    react(),
    ...(isProduction ? [] : [runtimeErrorOverlay()]),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  server: {
    port: 3002,
    strictPort: false,
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: 'es2020', // 현대적 브라우저 대상
    cssTarget: 'chrome100', // 최신 브라우저 CSS 기능 사용
    minify: isProduction ? 'terser' : false,
    terserOptions: isProduction ? {
      compress: {
        drop_console: false, // 콘솔 로그 유지
        drop_debugger: true
      }
    } : undefined,
    reportCompressedSize: false, // 빌드 속도 향상
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['date-fns', 'recharts', 'zod', 'wouter'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'lucide-react',
            'tailwind-merge'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      'date-fns',
      'zod'
    ]
  }
});
