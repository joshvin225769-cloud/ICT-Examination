export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) return res.status(409).json({ message: 'That email or reference already exists.' });
  if (error.name === 'VersionError') return res.status(409).json({ message: 'This request changed. Refresh and try again.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the supplied values.' });
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : 500;
  if (status >= 500) console.error('API error:', error.name, error.message);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong. Please try again.' : error.message });
}
