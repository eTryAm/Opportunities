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
  frontendUrl: process.env.FRONTEND_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@youthempowermenthub.org',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!@#',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, 'db/yeh.db'),
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cookieName: 'yeh_admin_token',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  cookieSameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
};

export default config;
