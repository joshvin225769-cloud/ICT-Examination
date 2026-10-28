import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getApplicationById, updateStatus, deleteApplication } from '../services/api';
import { getStatusColor, getAllowedNextStatuses, canDelete } from '../utils/statusUtils';
import { format } from 'date-fns';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await getApplicationById(id);
      if (response.data.success) {
        setApplication(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    setError('');
    try {
      const response = await updateStatus(id, newStatus);
      if (response.data.success) {
        setApplication(response.data.data);
        setNewStatus('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }
    try {
      const response = await deleteApplication(id);
      if (response.data.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete application');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!application) return <div>Application not found</div>;

  const allowedStatuses = getAllowedNextStatuses(application.status);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Application Details</h2>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <strong>Application ID:</strong> {application.applicationId}
          </div>
          <div>
            <strong>Company:</strong> {application.companyName}
          </div>
          <div>
            <strong>Job Role:</strong> {application.jobRole}
          </div>
          <div>
            <strong>Job Type:</strong> {application.jobType}
          </div>
          <div>
            <strong>Applied Date:</strong> {format(new Date(application.appliedDate), 'yyyy-MM-dd')}
          </div>
          <div>
            <strong>Expected Salary:</strong> {application.expectedSalary || 'N/A'}
          </div>
          <div>
            <strong>Follow-up Date:</strong> {format(new Date(application.followUpDate), 'yyyy-MM-dd')}
          </div>
          <div>
            <strong>Status:</strong>{' '}
            <span 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(application.status) }}
            >
              {application.status}
            </span>
            {application.isOverdue && <span className="overdue-badge">Follow-up Overdue</span>}
          </div>
        </div>
        
        {application.notes && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Notes:</strong>
            <p style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              {application.notes}
            </p>
          </div>
        )}
      </div>
      
      {allowedStatuses.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Update Status</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
              style={{ padding: '0.5rem', minWidth: '150px' }}
            >
              <option value="">Select next status</option>
              {allowedStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button 
              onClick={handleStatusUpdate} 
              className="btn btn-success"
              disabled={!newStatus || updating}
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      )}
      
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Status History</h3>
        <div className="timeline">
          {application.statusHistory && application.statusHistory.map((history, index) => (
            <div key={index} className="timeline-item">
              <strong>{history.status}</strong>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                {format(new Date(history.dateTime), 'yyyy-MM-dd HH:mm:ss')}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to={`/edit/${application._id}`} className="btn btn-secondary">Edit Application</Link>
        <button 
          onClick={handleDelete} 
          className="btn btn-danger"
          disabled={!canDelete(application.status)}
          title={!canDelete(application.status) ? 'Cannot delete applications in Interview or Offer status' : ''}
        >
          Delete Application
        </button>
      </div>
    </div>
  );
};

export default ApplicationDetail;
