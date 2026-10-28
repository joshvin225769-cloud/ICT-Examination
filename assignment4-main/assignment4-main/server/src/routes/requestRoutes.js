import { Router } from 'express';
import * as controller from '../controllers/requestController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate, validateId, requestSchema, statusSchema, commentSchema, querySchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errors.js';

export function requestRoutes(config) {
  const router = Router();
  router.use(authenticate(config));
  router.get('/', validate(querySchema, 'query'), asyncHandler(controller.list));
  router.get('/stats', asyncHandler(controller.stats));
  router.post('/', validate(requestSchema), asyncHandler(controller.create));
  router.use('/:id', validateId);
  router.get('/:id', asyncHandler(controller.detail));
  router.patch('/:id', validate(requestSchema), asyncHandler(controller.update));
  router.patch('/:id/status', adminOnly, validate(statusSchema), asyncHandler(controller.updateStatus));
  router.post('/:id/comments', validate(commentSchema), asyncHandler(controller.comment));
  router.delete('/:id', asyncHandler(controller.remove));
  return router;
}
