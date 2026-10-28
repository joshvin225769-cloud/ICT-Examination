import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, CATEGORIES, STATUSES } from '../services/api';
import { ErrorState, Loading, PageHeading } from '../components/UI';
import RequestTable from '../components/RequestTable';

export default function Requests() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const page = Number(params.get('page') || 1);
  const query = params.toString();
  const appliedSearch = params.get('search') || '';
  useEffect(() => { setSearch(appliedSearch); }, [appliedSearch]);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError('');
    api(`/requests?${query}`, { signal: controller.signal }).then(setResult).catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, [query, attempt]);
  function filter(key, value) {
    setParams(previous => { const next = new URLSearchParams(previous); next.delete('page'); value ? next.set(key, value) : next.delete(key); return next; });
  }
  const filtered = !!(params.get('search') || params.get('status') || params.get('category'));
  return <><PageHeading eyebrow={admin ? 'CAMPUS OPERATIONS' : 'KEEP THINGS MOVING'} title={admin ? 'All requests' : 'My requests'} description={admin ? 'One clear queue. A more responsive campus.' : 'Every request has a story. Follow yours here.'}>{!admin && <Link to="/requests/new" className="btn primary"><Plus size={18} />New request</Link>}</PageHeading>
    <section className="panel"><div className="request-toolbar"><form className="search-box" onSubmit={event => { event.preventDefault(); filter('search', search.trim()); }}><Search size={18} /><label className="sr-only" htmlFor="search">Search requests</label><input id="search" value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder="Search by title, ID or location…" /><button type="submit" className="search-submit" aria-label="Run search"><ChevronRight size={18} /></button></form><div className="filters"><SlidersHorizontal size={16} /><label className="sr-only" htmlFor="status-filter">Filter by status</label><select id="status-filter" value={params.get('status') || ''} onChange={e => filter('status', e.target.value)}><option value="">All statuses</option>{STATUSES.map(value => <option key={value}>{value}</option>)}</select><label className="sr-only" htmlFor="category-filter">Filter by category</label><select id="category-filter" value={params.get('category') || ''} onChange={e => filter('category', e.target.value)}><option value="">All categories</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></div></div>
      {filtered && <div className="filter-summary"><span>Showing filtered results</span><button onClick={() => { setSearch(''); setParams({}); }}>Clear filters <X size={13} /></button></div>}
      {error ? <ErrorState message={error} retry={() => setAttempt(v => v + 1)} /> : !result ? <Loading label="Finding your requests…" /> : <><RequestTable items={result.data} admin={admin} filtered={filtered} /><div className="pagination"><span>{result.pagination.total === 0 ? '0 requests' : `${(page - 1) * result.pagination.limit + 1}–${Math.min(page * result.pagination.limit, result.pagination.total)} of ${result.pagination.total} requests`}</span><div><button className="icon-btn bordered" aria-label="Previous page" disabled={page <= 1} onClick={() => setParams(p => { const n = new URLSearchParams(p); n.set('page', String(page - 1)); return n; })}><ChevronLeft size={17} /></button><span>Page {page} of {Math.max(1, result.pagination.pages)}</span><button className="icon-btn bordered" aria-label="Next page" disabled={page >= result.pagination.pages} onClick={() => setParams(p => { const n = new URLSearchParams(p); n.set('page', String(page + 1)); return n; })}><ChevronRight size={17} /></button></div></div></>}
    </section>
  </>;
}
