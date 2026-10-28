import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Building2, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Plus, ShieldCheck, Ticket } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Brand({ dark = false }) {
  return <span className={`brand ${dark ? 'brand-dark' : ''}`}><span className="brand-mark"><Building2 size={25} strokeWidth={1.7} /></span><span>campus<span className="brand-light">desk</span><span className="brand-period">.</span></span></span>;
}
export default function Layout() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const admin = user.role === 'admin';
  const initials = user.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  async function logout() {
    setBusy(true); setError('');
    try { await signOut(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <Link to="/" className="brand-link" aria-label="CampusDesk home"><Brand /></Link>
      <div className="workspace-label">CAMPUS WORKSPACE</div>
      <nav aria-label="Main navigation" className="side-nav">
        <NavLink end to="/"><LayoutDashboard size={19} />Overview</NavLink>
        <NavLink end to="/requests"><Ticket size={19} />{admin ? 'All requests' : 'My requests'}</NavLink>
        {!admin && <NavLink to="/requests/new"><Plus size={19} />New request</NavLink>}
      </nav>
      <div className="sidebar-note"><span className="note-symbol">↗</span><h3>A better campus.<br />One request at a time.</h3><p>Small fixes make a big difference. We’re here to help.</p><Link to="/requests">Track progress <ArrowUpRight size={15} /></Link></div>
      <div className="sidebar-bottom"><span className="connection-dot" />CONNECTED TO CAMPUS<span className="version">V1.0</span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumbs"><span className="desktop-only">Workspace</span><ChevronRight className="desktop-only" size={14} /><span>{location.pathname === '/' ? 'Overview' : 'Requests'}</span></div><Link className="mobile-brand" to="/" aria-label="CampusDesk home"><Brand dark /></Link><div className="topbar-right"><span className="role-label"><ShieldCheck size={15} />{admin ? 'Administrator' : 'Student portal'}</span><span className="avatar small">{initials}</span><span className="user-name">{user.name}</span><button className="icon-btn" onClick={logout} disabled={busy} aria-label="Sign out"><LogOut size={18} /></button></div></header>
      <nav className="mobile-nav" aria-label="Mobile navigation"><NavLink end to="/">Overview</NavLink><NavLink end to="/requests">{admin ? 'All requests' : 'My requests'}</NavLink>{!admin && <NavLink to="/requests/new"><Plus size={16} /> New request</NavLink>}</nav>
      <main id="main-content" className="main-content">{error && <div className="inline-error" role="alert">{error}</div>}<Outlet /></main>
      <footer className="footer"><span>Campus care, connected.</span><span><CircleHelp size={13} />CampusDesk · Student service workspace</span></footer>
    </div>
  </div>;
}
