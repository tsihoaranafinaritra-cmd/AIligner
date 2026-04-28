import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscription from './pages/Subscription';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import ExamPage from './pages/ExamPage';
import WorkingPage from './pages/WorkingPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [token, user]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/user" element={user?.role === 'user' ? <UserPage token={token} user={user} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminPage token={token} /> : <Navigate to="/login" />} />
        <Route path="/exam/:type" element={<ExamPage token={token} />} />
        <Route path="/working/:taskId" element={<WorkingPage token={token} />} />
      </Routes>
    </Router>
  );
}

export default App;