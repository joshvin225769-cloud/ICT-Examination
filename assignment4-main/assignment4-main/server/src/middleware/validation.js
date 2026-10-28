import { z } from 'zod';
import { categories, statuses, priorities } from '../models/ServiceRequest.js';

const password = z.string().min(10, 'Use at least 10 characters.').max(72)
  .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes.');
export const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email().max(254).transform(v => v.toLowerCase()), password }).strict();
export const loginSchema = z.object({
  email: z.email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(1).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes.')
}).strict();
export const requestSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(15).max(3000),
  category: z.enum(categories),
  location: z.string().trim().min(3).max(120),
  priority: z.enum(priorities).default('Medium')
}).strict();
export const statusSchema = z.object({ status: z.enum(statuses), priority: z.enum(priorities) }).strict();
export const commentSchema = z.object({ message: z.string().trim().min(1).max(1500) }).strict();
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(8),
  search: z.string().trim().max(100).default(''),
  status: z.enum(statuses).optional(),
  category: z.enum(categories).optional()
}).strict();

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({ message: 'Please check the highlighted fields.', errors: result.error.flatten().fieldErrors });
  }
  req[source === 'query' ? 'filters' : 'input'] = result.data;
  next();
};
export function validateId(req, res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ message: 'Invalid request ID.' });
  next();
}
