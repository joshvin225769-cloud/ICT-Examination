import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ErrorState, Loading } from './components/UI';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestForm from './pages/RequestForm';
import RequestDetail from './pages/RequestDetail';

function Protected() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
export default function App() {
  const { loading, error, refresh } = useAuth();
  if (loading) return <div className="boot-screen"><Loading label="Welcome to CampusDesk…" /></div>;
  if (error) return <div className="boot-screen"><ErrorState message={error} retry={refresh} /></div>;
  return <Routes><Route path="/login" element={<AuthPage key="login" />} /><Route path="/register" element={<AuthPage key="register" register />} /><Route element={<Protected />}><Route element={<Layout />}><Route index element={<Dashboard />} /><Route path="requests" element={<Requests />} /><Route path="requests/new" element={<RequestForm />} /><Route path="requests/:id" element={<RequestDetail />} /><Route path="requests/:id/edit" element={<RequestForm />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
