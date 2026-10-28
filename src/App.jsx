import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import AddApplication from './pages/AddApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import EditApplication from './pages/EditApplication';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <div className="App">
      <nav className="navbar">
        <h1>Job Application Tracker</h1>
        <nav>
          {user ? (
            <>
              <Link to="/">Home</Link>
              <Link to="/add">Add Application</Link>
              <span style={{ color: '#475569', padding: '0.5rem 1rem' }}>Welcome, {user.username}</span>
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={user ? <Home /> : <Login />} />
          <Route path="/add" element={user ? <AddApplication /> : <Login />} />
          <Route path="/application/:id" element={user ? <ApplicationDetail /> : <Login />} />
          <Route path="/edit/:id" element={user ? <EditApplication /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

