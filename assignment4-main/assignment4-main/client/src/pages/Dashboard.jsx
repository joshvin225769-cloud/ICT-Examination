import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCheck, Clock3, Plus, Sparkles, Ticket, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EmptyState, ErrorState, Loading, PageHeading } from '../components/UI';
import RequestTable from '../components/RequestTable';

const metrics = [
  { title: 'Total requests', key: 'total', Icon: Ticket, note: 'Every issue, accounted for', tone: 'teal' },
  { title: 'Open', key: 'Open', Icon: Clock3, note: 'Ready for a first look', tone: 'amber' },
  { title: 'In progress', key: 'In progress', Icon: Wrench, note: 'Good things are in motion', tone: 'blue' },
  { title: 'Resolved', key: 'Resolved', Icon: CheckCheck, note: 'A little better than before', tone: 'green' }
];
export default function Dashboard() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError(''); setData(null);
    try { const [stats, requests] = await Promise.all([api('/requests/stats'), api('/requests?limit=5')]); setData({ stats: stats.data, items: requests.data }); }
    catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <><PageHeading eyebrow="THE BIG PICTURE" title={`Hello, ${user.name.split(' ')[0]}.`} description={admin ? 'Here’s what’s happening across your campus today.' : 'A little visibility goes a long way. Here’s where things stand.'}>{!admin && <Link to="/requests/new" className="btn primary"><Plus size={18} />New request</Link>}</PageHeading>
    {error ? <ErrorState message={error} retry={load} /> : !data ? <Loading label="Gathering your campus updates…" /> : <>
      <div className="welcome-banner"><div className="welcome-banner-copy"><span className="banner-kicker"><Sparkles size={15} />{admin ? 'YOUR CAMPUS, IN GOOD HANDS' : 'YOUR VOICE MAKES A DIFFERENCE'}</span><h2>{admin ? 'Turn campus feedback into forward motion.' : 'A better campus starts with a small request.'}</h2><p>{admin ? 'Review the queue, set priorities, and keep students in the loop.' : 'Report an issue. Follow its journey. Get back to what matters.'}</p><Link to={admin ? '/requests' : '/requests/new'}>{admin ? 'Explore the work queue' : 'Let’s make things better'} <ArrowUpRight size={16} /></Link></div><div className="banner-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-card art-card-back"><span /><span /></div><div className="art-card art-card-front"><span className="art-check">✓</span><div><b>Request resolved</b><span>One more thing, made better.</span></div></div><span className="art-star">✳</span></div></div>
      <div className="metrics-grid">{metrics.map(({ title, key, Icon, note, tone }) => <article className={`metric-card ${tone}`} key={key}><div className="row-between"><span>{title}</span><span className="metric-icon"><Icon size={19} /></span></div><strong>{key === 'total' ? data.stats.total : data.stats.counts[key] || 0}<ArrowDownRight size={19} /></strong><p>{note}</p></article>)}</div>
      <div className="dashboard-columns"><section className="panel recent-panel"><div className="panel-heading"><div><h2>Recent requests</h2><p>{admin ? 'The latest from your campus community.' : 'Your latest requests, all in one place.'}</p></div><Link className="text-link" to="/requests">View all <ArrowRight size={15} /></Link></div><RequestTable items={data.items} admin={admin} /><div className="panel-foot"><span className="connection-dot" />Live from your campus workspace</div></section><aside className="dashboard-aside"><section className="panel category-panel"><div className="panel-heading"><div><h2>By category</h2><p>Where attention is needed.</p></div><span className="tiny-label">ALL TIME</span></div>{data.stats.categories.length ? <div className="category-bars">{data.stats.categories.map((row, i) => <div key={row.category}><div className="row-between"><span><i className={`category-dot color-${i % 6}`} />{row.category}</span><b>{row.count}</b></div><div className="bar-track"><div className={`bar-fill color-${i % 6}`} style={{ width: `${Math.max(5, row.count / data.stats.total * 100)}%` }} /></div></div>)}</div> : <EmptyState title="No categories yet" message="Your requests will appear here." action={false} />}</section><section className="tip-card"><span className="tip-icon"><Sparkles size={19} /></span><div className="eyebrow">A LITTLE TIP</div><h3>Details make the difference.</h3><p>A clear location and a few specifics help the right people solve your issue faster.</p><span>Small effort. Better outcomes. <ArrowUpRight size={15} /></span></section></aside></div>
    </>}
  </>;
}
