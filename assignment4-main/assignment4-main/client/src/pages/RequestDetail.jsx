import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, LoaderCircle, MapPin, MessageSquare, Pencil, Send, ShieldCheck, Tag, Trash2, UserRound } from 'lucide-react';
import { api, PRIORITIES, STATUSES } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorState, Field, Loading, PriorityBadge, StatusBadge, formatDate } from '../components/UI';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('Open');
  const [priority, setPriority] = useState('Medium');
  const admin = user.role === 'admin';
  const load = useCallback(async () => {
    setItem(null); setLoadError('');
    try { const { data } = await api(`/requests/${id}`); setItem(data); setStatus(data.status); setPriority(data.priority); }
    catch (err) { setLoadError(err.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  async function addComment(e) {
    e.preventDefault(); setError('');
    if (!comment.trim()) { setCommentError('Write an update before sending.'); return; }
    setCommentError(''); setBusy('comment');
    try { setItem((await api(`/requests/${id}/comments`, { method: 'POST', body: { message: comment.trim() } })).data); setComment(''); toast('Your update has been added.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(''); }
  }
  async function saveStatus(e) {
    e.preventDefault(); setBusy('status'); setError('');
    try { const { data } = await api(`/requests/${id}/status`, { method: 'PATCH', body: { status, priority } }); setItem(data); toast('Request progress updated.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(''); }
  }
  async function remove() {
    if (!window.confirm('Delete this open request? This cannot be undone.')) return;
    setBusy('delete'); setError('');
    try { await api(`/requests/${id}`, { method: 'DELETE' }); toast('Request deleted.'); navigate('/requests'); }
    catch (err) { setError(err.message); }
    finally { setBusy(''); }
  }
  if (loadError) return <ErrorState message={loadError} retry={load} />;
  if (!item) return <Loading label="Opening your request…" />;
  const ownOpen = item.owner?._id === user.id && item.status === 'Open';
  const stage = STATUSES.indexOf(item.status);
  return <><Link className="back-link" to="/requests"><ArrowLeft size={16} />Back to requests</Link><div className="detail-heading"><div><div className="detail-reference"><span>{item.reference}</span><span>·</span><StatusBadge value={item.status} /></div><h1>{item.title}</h1><p><MapPin size={15} />{item.location}<span>·</span>Created {formatDate(item.createdAt, true)}</p></div>{ownOpen && <div className="detail-actions"><Link className="btn secondary" to={`/requests/${id}/edit`}><Pencil size={15} />Edit request</Link><button className="icon-btn danger" aria-label="Delete request" disabled={!!busy} onClick={remove}><Trash2 size={18} /></button></div>}</div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="detail-layout"><div><section className="panel detail-description"><div className="panel-heading"><h2>About this request</h2><Tag size={18} /></div><p className="description-text">{item.description}</p><div className="request-progress" aria-label={`Current status: ${item.status}`}>{STATUSES.map((value, index) => <div key={value} className={index <= stage ? 'complete' : ''}><span>{index < stage ? <Check size={14} /> : index + 1}</span><small>{value}</small></div>)}</div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Activity & updates</h2><p>Every step forward, in one place.</p></div><span className="count-pill">{item.activity.length}</span></div><ol className="activity-list">{item.activity.map(activity => <li key={activity._id}><span className={`activity-icon ${activity.type === 'comment' ? 'comment-icon' : ''}`}>{activity.type === 'comment' ? <MessageSquare size={15} /> : activity.type === 'status' ? <Check size={15} /> : <Clock3 size={15} />}</span><div><div className="activity-top"><strong>{activity.actor}</strong><time dateTime={activity.at}>{new Date(activity.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></div><p>{activity.message}</p></div></li>)}</ol><form className="comment-form" onSubmit={addComment} noValidate><Field id="comment" label="Keep the conversation going" error={commentError}><textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3} maxLength={1500} placeholder="Add a detail, ask a question, or share an update…" /></Field><button className="btn primary" disabled={!!busy}>{busy === 'comment' ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}Add update</button></form></section>
    </div><aside><section className="panel detail-meta"><div className="panel-heading"><h2>At a glance</h2></div><dl><div><dt><UserRound size={16} />Reported by</dt><dd>{item.owner?.name || 'Student'}</dd></div><div><dt><Tag size={16} />Category</dt><dd>{item.category}</dd></div><div><dt><MapPin size={16} />Location</dt><dd>{item.location}</dd></div><div><dt><Clock3 size={16} />Priority</dt><dd><PriorityBadge value={item.priority} /></dd></div><div><dt><CalendarDays size={16} />Last updated</dt><dd>{formatDate(item.updatedAt, true)}</dd></div></dl></section>{admin ? <form className="panel admin-controls" onSubmit={saveStatus}><h2><ShieldCheck size={19} />Resolution desk</h2><p>Keep the campus community in the loop.</p><Field id="manage-status" label="Status"><select id="manage-status" value={status} onChange={e => setStatus(e.target.value)}>{STATUSES.map(v => <option key={v}>{v}</option>)}</select></Field><Field id="manage-priority" label="Priority"><select id="manage-priority" value={priority} onChange={e => setPriority(e.target.value)}>{PRIORITIES.map(v => <option key={v}>{v}</option>)}</select></Field><button className="btn primary" disabled={!!busy || (status === item.status && priority === item.priority)}>{busy === 'status' && <LoaderCircle size={15} className="spin" />}Save progress<ChevronRight size={16} /></button></form> : <div className="info-note"><ShieldCheck size={20} /><p>Your campus team is on the other side. Any updates will appear in your activity feed.</p></div>}</aside></div>
  </>;
}
