import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getApplicationById, updateApplication } from '../services/api';

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    jobRole: '',
    jobType: 'Full-time',
    expectedSalary: '',
    notes: ''
  });
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await getApplicationById(id);
        if (response.data.success) {
          const app = response.data.data;
          setApplication(app);
          setFormData({
            companyName: app.companyName,
            jobRole: app.jobRole,
            jobType: app.jobType,
            expectedSalary: app.expectedSalary || '',
            notes: app.notes || ''
          });
        }
      } catch (err) {
        setError('Failed to fetch application');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUpdating(true);

    try {
      const response = await updateApplication(id, formData);
      if (response.data.success) {
        navigate(`/application/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!application) return <div>Application not found</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Edit Application</h2>
        <Link to={`/application/${id}`} className="btn btn-secondary">Back to Details</Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
          <strong>Application ID:</strong> {application.applicationId} (cannot be edited)<br />
          <strong>Applied Date:</strong> {new Date(application.appliedDate).toLocaleDateString()} (cannot be edited)
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Job Role *</label>
            <input
              type="text"
              name="jobRole"
              value={formData.jobRole}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Job Type *</label>
            <select
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              required
            >
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Expected Salary (optional)</label>
            <input
              type="number"
              name="expectedSalary"
              value={formData.expectedSalary}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={updating}>
            {updating ? 'Updating...' : 'Update Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditApplication;
