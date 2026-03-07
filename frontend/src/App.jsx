import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Styles
import './index.css';
import './App.css';

// Components
import Navbar from './components/Navbar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExamPage from './pages/ExamPage';
import AdminDashboard from './pages/AdminDashboard';

// --- AXIOS CONFIG ---
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (saved) setUser(JSON.parse(saved));
        setLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
    };

    if (loading) return null;

    return (
        <Router>
            <Navbar user={user} handleLogout={handleLogout} />
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage setUser={setUser} />} />
                <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage setUser={setUser} />} />
                <Route path="/" element={user ? <HomePage user={user} /> : <Navigate to="/login" />} />
                <Route path="/test/:id" element={user ? <ExamPage /> : <Navigate to="/login" />} />
                <Route
                    path="/admin"
                    element={user && (user.role === 'ADMIN' || user.role === 'TRAINER') ? <AdminDashboard /> : <Navigate to={user ? "/" : "/login"} />}
                />
            </Routes>
        </Router>
    );
}

export default App;
