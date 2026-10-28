import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllApplications } from '../services/api';
import { getStatusColor, canDelete } from '../utils/statusUtils';
import { format } from 'date-fns';

const Home = () => {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await getAllApplications(params);
      if (response.data.success) {
        setApplications(response.data.data.applications);
        setCounts(response.data.data.counts);
      }
    } catch (err) {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, searchTerm]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>My Job Applications</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="counts">
        <div className="count-card">
          <strong>All:</strong> {counts.all || 0}
        </div>
        <div className="count-card">
          <strong>Applied:</strong> {counts.Applied || 0}
        </div>
        <div className="count-card">
          <strong>Interview:</strong> {counts.Interview || 0}
        </div>
        <div className="count-card">
          <strong>Offer:</strong> {counts.Offer || 0}
        </div>
        <div className="count-card">
          <strong>Rejected:</strong> {counts.Rejected || 0}
        </div>
        <div className="count-card">
          <strong>Accepted:</strong> {counts.Accepted || 0}
        </div>
        <div className="count-card">
          <strong>Declined:</strong> {counts.Declined || 0}
        </div>
      </div>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search by company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Applied">Applied</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
        </select>
      </div>
      
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Applied Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app._id}>
                <td>{app.applicationId}</td>
                <td>{app.companyName}</td>
                <td>{app.jobRole}</td>
                <td>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(app.status) }}
                  >
                    {app.status}
                  </span>
                  {app.isOverdue && <span className="overdue-badge">Follow-up Overdue</span>}
                </td>
                <td>{format(new Date(app.appliedDate), 'yyyy-MM-dd')}</td>
                <td>
                  <Link to={`/application/${app._id}`} className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
                    View
                  </Link>
                  <Link to={`/edit/${app._id}`} className="btn btn-secondary">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No applications found
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
