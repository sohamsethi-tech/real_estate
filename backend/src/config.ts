import "./load-env.js";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  SESSION_TTL_HOURS: z.coerce.number().default(8),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  PUBLIC_SITE_URL: z.string().default("http://localhost:5173"),
  USE_FIXTURES: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  SEED_FIXTURES: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  EMBEDDED_POSTGRES: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  EMBEDDED_PORT: z.coerce.number().default(54329),
  EMBEDDED_DATA_DIR: z.string().default(".pgdata"),
  VAULTRE_API_BASE: z.string().optional(),
  VAULTRE_API_KEY: z.string().optional(),
  VAULTRE_ACCESS_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  NOTIFY_EMAIL: z.string().email().optional().or(z.literal("")),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default("V Group Admin"),
});

export const config = schema.parse(process.env);

if (config.NODE_ENV === "production" && config.USE_FIXTURES) {
  throw new Error("USE_FIXTURES must be false in production");
}
if (config.NODE_ENV === "production" && config.SEED_FIXTURES) {
  throw new Error("SEED_FIXTURES must be false in production");
}
if (config.NODE_ENV === "production" && config.EMBEDDED_POSTGRES) {
  throw new Error("EMBEDDED_POSTGRES must be false in production");
}

export function emailConfigured() {
  return Boolean(config.SMTP_HOST && config.SMTP_FROM && config.NOTIFY_EMAIL);
}

export function vaultreConfigured() {
  return Boolean(config.VAULTRE_API_KEY && config.VAULTRE_ACCESS_TOKEN);
}
