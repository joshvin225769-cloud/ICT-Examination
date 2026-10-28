import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, logout, me } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

export function authRoutes(config) {
  const router = Router();
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many attempts. Please try again in 15 minutes.' } });
  router.post('/register', limiter, validate(registerSchema), asyncHandler(register(config)));
  router.post('/login', limiter, validate(loginSchema), asyncHandler(login(config)));
  router.post('/logout', logout(config));
  router.get('/me', authenticate(config), me);
  return router;
}
