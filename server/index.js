import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from './config.js';
import { initDatabase, closeDatabase } from './db/database.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import publicRouter from './routes/public.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

if (config.nodeEnv === 'production' && (config.jwtSecret === 'dev-secret-change-in-production' || config.adminPassword === 'ChangeMe123!@#')) {
  console.warn('⚠️ WARNING: Using default JWT_SECRET or ADMIN_PASSWORD in production. Set strong credentials in your environment variables.');
}

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
];
if (config.corsOrigin) {
  config.corsOrigin.split(',').map((o) => o.trim()).forEach((o) => allowedOrigins.push(o));
}
if (config.frontendUrl) {
  config.frontendUrl.split(',').map((o) => o.trim()).forEach((o) => allowedOrigins.push(o));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // In development or if origin matches allowed list or vercel preview subdomains
      if (
        config.nodeEnv !== 'production' ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Health check endpoints for Render and uptime monitoring
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

app.use('/api', apiRateLimiter);
app.use('/api/public', publicRouter);
app.use('/api/admin/auth', authRouter);
app.use('/api/admin', adminRouter);

// Static uploads (for local development or migrated local assets)
const uploadsPath = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(uploadsPath)
);

// If client dist exists (e.g. monolithic hosting), serve it
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { index: false, maxAge: config.nodeEnv === 'production' ? '1h' : 0 }));
  app.get(/^(?!\/(api|uploads|health)).*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((req, res) => res.status(404).json({ error: `No route found for ${req.method} ${req.path}.` }));

app.use((err, _req, res, _next) => {
  if (err.message === 'Blocked by CORS policy') {
    return res.status(403).json({ error: 'CORS policy: Access denied from this origin.' });
  }
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: status >= 500 && config.nodeEnv === 'production' ? 'An unexpected server error occurred.' : err.message,
  });
});

let server;

async function startServer() {
  try {
    await initDatabase();
    server = app.listen(config.port, () => {
      console.log(`Youth Empowerment Hub API is running on port ${config.port} [${config.nodeEnv}].`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down server gracefully...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      try {
        closeDatabase();
        console.log('Database connection closed.');
      } catch (err) {
        console.error('Error closing database:', err);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
