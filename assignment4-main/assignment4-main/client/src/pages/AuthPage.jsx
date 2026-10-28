import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Brand } from '../components/Layout';
import { Field } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ register = false }) {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const change = event => setValues(prev => ({ ...prev, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setError('');
    const next = {};
    if (register && values.name.trim().length < 2) next.name = 'Enter your full name (at least 2 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (!values.password || (register && values.password.length < 10)) next.password = register ? 'Use at least 10 characters.' : 'Enter your password.';
    if (register && new TextEncoder().encode(values.password).length > 72) next.password = 'Use at most 72 UTF-8 bytes.';
    setErrors(next); if (Object.keys(next).length) return;
    setBusy(true);
    try { await signIn(register ? 'register' : 'login', { ...(register ? { name: values.name.trim() } : {}), email: values.email.trim(), password: values.password }); navigate('/', { replace: true }); }
    catch (err) { setError(err.message); setErrors(err.errors || {}); }
    finally { setBusy(false); }
  }
  return <div className="auth-page"><aside className="auth-story"><Brand /><div className="auth-story-content"><span className="pill-outline"><span className="connection-dot" />A MORE CONNECTED CAMPUS</span><h1>Good campuses<br />start with<br /><em>being heard.</em></h1><p>From a broken light to a better Wi-Fi connection.<br />A simple way to speak up, stay updated, and see things get done.</p><div className="auth-benefits">{['One place for every request', 'Real progress, not guesswork', 'Built around your campus'].map(text => <span key={text}><Check size={16} />{text}</span>)}</div></div><div className="auth-illustration" aria-hidden="true"><div className="building building-one"><i /><i /><i /><i /><i /><i /></div><div className="building building-two"><span className="building-roof" /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="building building-three"><i /><i /><i /><i /></div><div className="ground-line" /><div className="illustration-label">YOUR CAMPUS. A LITTLE BETTER, EVERY DAY.</div></div><div className="auth-credit">CAMPUSDESK <span>EST. 2026</span></div></aside><main className="auth-main"><Link to="/login" className="auth-mobile-logo" aria-label="CampusDesk"><Brand dark /></Link><div className="auth-form-wrap"><span className="eyebrow">YOUR CAMPUS WORKSPACE</span><h2>{register ? 'Make yourself at home.' : 'Welcome back.'}</h2><p className="auth-intro">{register ? 'Create your student account and help shape a better campus.' : 'Sign in to pick up where you left off.'}</p><form noValidate onSubmit={submit}>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {register && <Field id="name" label="Full name" error={errors.name}><input id="name" name="name" autoComplete="name" value={values.name} onChange={change} maxLength={80} aria-invalid={!!errors.name} placeholder="Your full name" /></Field>}
    <Field id="email" label="Email address" error={errors.email}><input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={change} maxLength={254} aria-invalid={!!errors.email} placeholder="you@college.edu" /></Field>
    <Field id="password" label="Password" error={errors.password} hint={register ? 'At least 10 characters. Make it something only you know.' : undefined}><div className="password-input"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={values.password} onChange={change} maxLength={72} aria-invalid={!!errors.password} placeholder={register ? 'Create a strong password' : 'Enter your password'} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field>
    <button className="btn primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : null}{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}<ArrowRight size={18} /></button>
  </form><p className="auth-switch">{register ? 'Already part of the campus?' : 'New around here?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'} <ArrowUpRightSmall /></Link></p><div className="secure-note"><LockKeyhole size={14} />Your account. Your requests. Securely connected.</div></div><footer className="auth-footer">CampusDesk · Campus care, connected.</footer></main></div>;
}
function ArrowUpRightSmall() { return <span aria-hidden="true">↗</span>; }
