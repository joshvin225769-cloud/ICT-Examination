export const getStatusColor = (status) => {
  const colors = {
    'Applied': '#3b82f6',
    'Interview': '#f59e0b',
    'Rejected': '#ef4444',
    'Offer': '#8b5cf6',
    'Accepted': '#10b981',
    'Declined': '#6b7280'
  };
  return colors[status] || '#6b7280';
};

export const getAllowedNextStatuses = (currentStatus) => {
  const transitions = {
    'Applied': ['Interview', 'Rejected'],
    'Interview': ['Offer', 'Rejected'],
    'Offer': ['Accepted', 'Declined'],
    'Rejected': [],
    'Accepted': [],
    'Declined': []
  };
  return transitions[currentStatus] || [];
};

export const canDelete = (status) => {
  return status === 'Applied' || status === 'Rejected' || status === 'Accepted' || status === 'Declined';
};
