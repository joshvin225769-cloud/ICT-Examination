import bcrypt from 'bcryptjs';
import { User, publicUser } from '../models/User.js';
import { HttpError } from '../middleware/errors.js';
import { setSession, cookieOptions } from '../middleware/auth.js';

export const register = config => async (req, res) => {
  const { name, email, password } = req.input;
  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'student' });
  setSession(res, user, config);
  res.status(201).json({ data: publicUser(user) });
};
export const login = config => async (req, res) => {
  const user = await User.findOne({ email: req.input.email }).select('+passwordHash');
  // A fixed dummy hash keeps the no-account path from skipping the costly hash check.
  const hash = user?.passwordHash || '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
  const valid = await bcrypt.compare(req.input.password, hash);
  if (!user || !valid) throw new HttpError(401, 'Email or password is incorrect.');
  setSession(res, user, config);
  res.json({ data: publicUser(user) });
};
export const logout = config => (req, res) => {
  const { maxAge, ...options } = cookieOptions(config);
  res.clearCookie('campusdesk_session', options);
  res.json({ message: 'Signed out successfully.' });
};
export const me = (req, res) => res.json({ data: publicUser(req.user) });
