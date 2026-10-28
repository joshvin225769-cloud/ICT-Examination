import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/applications';

export const getAllApplications = (params = {}) => {
  return axios.get(API_URL, { params });
};

export const getApplicationById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

export const createApplication = (data) => {
  return axios.post(API_URL, data);
};

export const updateApplication = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data);
};

export const updateStatus = (id, status) => {
  return axios.put(`${API_URL}/${id}/status`, { status });
};

export const deleteApplication = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

