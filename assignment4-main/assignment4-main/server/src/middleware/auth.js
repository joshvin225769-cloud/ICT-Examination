import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from './errors.js';

export const authenticate = config => asyncHandler(async (req, res, next) => {
  let payload;
  try { payload = jwt.verify(req.cookies.campusdesk_session, config.jwtSecret, { algorithms: ['HS256'] }); }
  catch { throw new HttpError(401, 'Please sign in to continue.'); }
  if (!payload.sub || !/^[a-f\d]{24}$/i.test(payload.sub)) throw new HttpError(401, 'Invalid session. Please sign in again.');
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Your session is no longer valid.');
  req.user = user;
  next();
});
export function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return next(new HttpError(403, 'Administrator access is required.'));
  next();
}
export function cookieOptions(config) {
  return { httpOnly: true, sameSite: 'lax', secure: config.production, path: '/', maxAge: 8 * 60 * 60 * 1000 };
}
export function setSession(res, user, config) {
  const token = jwt.sign({}, config.jwtSecret, { subject: user._id.toString(), expiresIn: '8h', algorithm: 'HS256' });
  res.cookie('campusdesk_session', token, cookieOptions(config));
}
