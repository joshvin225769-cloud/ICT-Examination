import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { authRoutes } from './routes/authRoutes.js';
import { requestRoutes } from './routes/requestRoutes.js';
import { errorHandler, HttpError } from './middleware/errors.js';

export function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy || false);
  app.use(helmet({ contentSecurityPolicy: config.production ? undefined : false }));
  app.use(cors({ origin: config.origin, credentials: true }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') && req.get('origin') !== config.origin) {
      return next(new HttpError(403, 'This origin is not allowed.'));
    }
    next();
  });
  app.get('/api/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ data: { ready: mongoose.connection.readyState === 1 } }));
  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 240, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Please slow down and try again shortly.' } }));
  app.use('/api/auth', authRoutes(config));
  app.use('/api/requests', requestRoutes(config));
  app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
  const clientDir = fileURLToPath(new URL('../../client/dist', import.meta.url));
  if (existsSync(path.join(clientDir, 'index.html'))) {
    app.use(express.static(clientDir));
    app.get('*', (req, res, next) => {
      if (path.extname(req.path)) return next();
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }
  app.use((req, res) => res.status(404).json({ message: 'Page not found.' }));
  app.use(errorHandler);
  return app;
}
