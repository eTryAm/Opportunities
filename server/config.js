import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '7d',
  bcryptRounds: 12,
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '8', 10),
  maxLoginAttempts: 5,
  lockoutMinutes: 30,
  loginRateLimitWindowMs: 15 * 60 * 1000,
  loginRateLimitMax: 5,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@youthempowermenthub.org',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!@#',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, 'db/yeh.db'),
  cookieName: 'yeh_admin_token',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
};

export default config;
