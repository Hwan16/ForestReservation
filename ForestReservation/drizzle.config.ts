import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "postgres",
    ssl: false,
  },
} satisfies Config;
