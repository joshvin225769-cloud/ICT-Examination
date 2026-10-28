import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Info, LoaderCircle, MapPin, Sparkles } from 'lucide-react';
import { api, CATEGORIES, PRIORITIES } from '../services/api';
import { ErrorState, Field, Loading, PageHeading } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const initial = { title: '', category: '', location: '', description: '', priority: 'Medium' };
export default function RequestForm() {
  const { id } = useParams();
  const editing = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!editing) { setValues(initial); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    api(`/requests/${id}`, { signal: controller.signal }).then(({ data }) => {
      if (data.status !== 'Open' || data.owner._id !== user.id) { setLoadError('Only your own open requests can be edited.'); return; }
      setValues(Object.fromEntries(Object.keys(initial).map(key => [key, data[key]])));
    }).catch(err => { if (err.name !== 'AbortError') setLoadError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, editing, user.id, attempt]);
  if (user.role === 'admin') return <Navigate to="/requests" replace />;
  const change = e => setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault(); setError('');
    const next = {};
    if (values.title.trim().length < 5) next.title = 'Add a clear title of at least 5 characters.';
    if (!CATEGORIES.includes(values.category)) next.category = 'Choose the team that can help.';
    if (values.location.trim().length < 3) next.location = 'Tell us where to find the issue (at least 3 characters).';
    if (values.description.trim().length < 15) next.description = 'Please add at least 15 characters of detail.';
    setErrors(next); if (Object.keys(next).length) { document.getElementById(Object.keys(next)[0])?.focus(); return; }
    setBusy(true);
    try { const result = await api(editing ? `/requests/${id}` : '/requests', { method: editing ? 'PATCH' : 'POST', body: values }); toast(editing ? 'Request updated. Thanks for keeping us in the loop.' : 'Request submitted. You’re on the way to a better campus.'); navigate(`/requests/${result.data._id}`); }
    catch (err) { setError(err.message); setErrors(err.errors || {}); }
    finally { setBusy(false); }
  }
  return <><Link to={editing ? `/requests/${id}` : '/requests'} className="back-link"><ArrowLeft size={16} />Back to {editing ? 'request' : 'requests'}</Link><PageHeading eyebrow="LET’S MAKE IT BETTER" title={editing ? 'Refine your request' : 'What needs a little attention?'} description="A few details now can make a real difference later." />
    {loading ? <Loading /> : loadError ? <ErrorState message={loadError} retry={() => setAttempt(v => v + 1)} /> : <div className="form-layout"><form className="panel request-form" onSubmit={submit} noValidate><div className="form-section-title"><ClipboardList size={19} /><div><h2>Request details</h2><p>Help us understand what’s happening.</p></div></div>{error && <div className="inline-error" role="alert">{error}</div>}
      <Field id="title" label="Give your request a title" error={errors.title} hint="Keep it short and specific. A good title tells half the story."><input id="title" name="title" value={values.title} onChange={change} maxLength={120} placeholder="e.g. Wi-Fi connection dropping in the library" aria-invalid={!!errors.title} /></Field>
      <div className="form-row"><Field id="category" label="Category" error={errors.category}><select id="category" name="category" value={values.category} onChange={change} aria-invalid={!!errors.category}><option value="">Choose a category</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></Field><Field id="location" label="Location" error={errors.location}><div className="input-with-icon"><MapPin size={16} /><input id="location" name="location" value={values.location} onChange={change} maxLength={120} placeholder="Building, floor or room" aria-invalid={!!errors.location} /></div></Field></div>
      <Field id="description" label="Tell us a little more" error={errors.description}><textarea id="description" name="description" value={values.description} onChange={change} minLength={15} maxLength={3000} rows={6} placeholder="What’s happening? When did you notice it? Anything else that might help?" aria-invalid={!!errors.description} /><div className="textarea-count">{values.description.length} / 3,000</div></Field>
      <fieldset className="priority-field"><legend>How urgent is it?</legend><div className="priority-options">{PRIORITIES.map((value, i) => <label key={value} className={values.priority === value ? 'selected' : ''}><input type="radio" name="priority" value={value} checked={values.priority === value} onChange={change} /><span className={`priority-symbol priority-${value.toLowerCase()}`}><i /></span><strong>{value}</strong><small>{['When there’s a moment', 'Needs attention soon', 'Affects campus activity'][i]}</small>{values.priority === value && <Check className="selected-check" size={15} />}</label>)}</div></fieldset>
      <div className="form-actions"><Link className="btn secondary" to={editing ? `/requests/${id}` : '/requests'}>Cancel</Link><button className="btn primary" disabled={busy}>{busy && <LoaderCircle size={17} className="spin" />}{busy ? 'Saving…' : editing ? 'Save changes' : 'Submit request'}<ArrowRight size={17} /></button></div>
    </form><aside className="form-aside"><div className="tip-card light"><Sparkles size={23} /><div className="eyebrow">A GREAT REQUEST HAS…</div><h3>A little context.<br />A clear direction.</h3><ul><li><Check size={15} />A title that gets to the point</li><li><Check size={15} />The exact place to look</li><li><Check size={15} />A description of the issue</li><li><Check size={15} />An honest sense of urgency</li></ul></div><div className="info-note"><Info size={19} /><p>Once submitted, your request goes to the campus team. You can follow updates right here.</p></div></aside></div>}
  </>;
}
