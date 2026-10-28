const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors || {}; }
}
export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method, credentials: 'include', signal,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('We couldn’t reach CampusDesk. Check your connection and try again.', 0);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('session-expired'));
    throw new ApiError(result.message || 'The request could not be completed. Please try again.', response.status, result.errors);
  }
  return result;
}
export const CATEGORIES = ['IT & Network', 'Facilities', 'Academic', 'Library', 'Hostel', 'Other'];
export const STATUSES = ['Open', 'In progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
