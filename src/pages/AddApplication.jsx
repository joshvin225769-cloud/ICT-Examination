import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApplication } from '../services/api';

const AddApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    jobRole: '',
    jobType: 'Full-time',
    appliedDate: '',
    expectedSalary: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Frontend validation for applied date
    if (formData.appliedDate) {
      const appliedDate = new Date(formData.appliedDate);
      const now = new Date();
      const appliedDateOnly = new Date(appliedDate.getFullYear(), appliedDate.getMonth(), appliedDate.getDate());
      const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (appliedDateOnly > nowOnly) {
        setError('Applied date cannot be a future date');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await createApplication(formData);
      if (response.data.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Add New Application</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="card" style={{ maxWidth: '600px' }}>
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
            <label>Applied Date *</label>
            <input
              type="date"
              name="appliedDate"
              value={formData.appliedDate}
              onChange={handleChange}
              required
            />
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
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddApplication;
