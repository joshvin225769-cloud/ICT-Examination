import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PriorityBadge, StatusBadge, formatDate } from './UI';

export default function RequestTable({ items, admin, filtered = false }) {
  if (!items.length) return <EmptyState title={filtered ? 'No requests found' : undefined} message={filtered ? 'Try another search or clear your filters to see more requests.' : undefined} action={!filtered && !admin} />;
  return <div className="request-items"><table className="request-table"><thead><tr><th>REQUEST</th><th>CATEGORY</th><th>STATUS</th><th>PRIORITY</th><th>CREATED</th><th><span className="sr-only">View</span></th></tr></thead><tbody>{items.map(item => <tr key={item._id}>
    <td><Link className="request-title" to={`/requests/${item._id}`}>{item.title}<ArrowUpRight size={14} /></Link><div className="request-subtitle">{item.reference}<span>·</span>{admin ? item.owner?.name || 'Student' : item.location}</div></td>
    <td><span className="category-text">{item.category}</span></td><td><StatusBadge value={item.status} /></td><td><PriorityBadge value={item.priority} /></td><td className="table-date">{formatDate(item.createdAt)}</td><td><Link to={`/requests/${item._id}`} aria-label={`View ${item.title}`} className="table-arrow"><ArrowRight size={17} /></Link></td>
  </tr>)}</tbody></table><div className="mobile-request-cards">{items.map(item => <Link className="mobile-request-card" key={item._id} to={`/requests/${item._id}`}><div className="row-between"><span className="request-reference">{item.reference}</span><StatusBadge value={item.status} /></div><h3>{item.title}</h3><p><MapPin size={14} />{item.location}</p><div className="row-between"><span className="category-text">{item.category}</span><PriorityBadge value={item.priority} /></div></Link>)}</div></div>;
}
