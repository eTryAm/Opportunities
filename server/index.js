import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
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
  throw new Error('Production requires JWT_SECRET and a non-default ADMIN_PASSWORD. See .env.example.');
}

initDatabase();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(cors({ origin: config.corsOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api', apiRateLimiter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/public', publicRouter);
app.use('/api/admin/auth', authRouter);
app.use('/api/admin', adminRouter);

const distPath = path.resolve(__dirname, '../dist');
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', (_req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); }, express.static(uploadsPath));
app.use(express.static(distPath, { index: false, maxAge: config.nodeEnv === 'production' ? '1h' : 0 }));
app.get(/^(?!\/(api|uploads)).*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.use((req, res) => res.status(404).json({ error: `No route found for ${req.method} ${req.path}.` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: status >= 500 ? 'An unexpected server error occurred.' : err.message });
});

const server = app.listen(config.port, () => {
  console.log(`Youth Empowerment Hub API is running on port ${config.port}.`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down server gracefully...`);
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

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
