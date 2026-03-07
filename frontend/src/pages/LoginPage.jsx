import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = ({ setUser }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/auth/login', formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '150px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass auth-page">
                <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-label">Email Address</label>
                        <input
                            type="email"
                            required
                            className="auth-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="auth-form-group">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            required
                            className="auth-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button className="button-primary full-width">
                        <LogIn size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Sign In
                    </button>
                </form>
                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
