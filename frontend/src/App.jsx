import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AddApplication from './pages/AddApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import EditApplication from './pages/EditApplication';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>Job Application Tracker</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/add">Add Application</Link>
          </nav>
        </nav>
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddApplication />} />
            <Route path="/application/:id" element={<ApplicationDetail />} />
            <Route path="/edit/:id" element={<EditApplication />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
