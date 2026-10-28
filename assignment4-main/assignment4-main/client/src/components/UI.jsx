import { AlertCircle, ArrowUpRight, Inbox, LoaderCircle, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Loading({ label = 'Getting everything ready…' }) {
  return <div className="state-panel" role="status"><LoaderCircle className="spin" size={28} /><p>{label}</p></div>;
}
export function ErrorState({ message, retry }) {
  return <div className="state-panel error-state" role="alert"><AlertCircle size={28} /><h3>Let’s try that again</h3><p>{message}</p>{retry && <button className="btn secondary" onClick={retry}><RotateCw size={16} />Try again</button>}</div>;
}
export function EmptyState({ title = 'A clean slate', message = 'You haven’t submitted a request yet. Let’s make campus a little better.', action = true }) {
  return <div className="state-panel empty-state"><div className="empty-icon"><Inbox size={28} /></div><h3>{title}</h3><p>{message}</p>{action && <Link className="btn primary" to="/requests/new">Create a request <ArrowUpRight size={16} /></Link>}</div>;
}
export const statusClass = value => value.toLowerCase().replace(/\s+/g, '-');
export function StatusBadge({ value }) { return <span className={`badge status-${statusClass(value)}`}><i />{value}</span>; }
export function PriorityBadge({ value }) { return <span className={`priority priority-${value.toLowerCase()}`}><i />{value}</span>; }
export function Field({ label, id, error, hint, children }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && <small id={`${id}-hint`}>{hint}</small>}{error && <span className="field-error" id={`${id}-error`} role="alert">{Array.isArray(error) ? error[0] : error}</span>}</div>;
}
export function PageHeading({ eyebrow, title, description, children }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>;
}
export function formatDate(value, full = false) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(full ? { year: 'numeric' } : {}) });
}
export function timeAgo(value) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value)) / 86400000));
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
}
