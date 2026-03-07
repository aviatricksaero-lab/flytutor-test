import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = ({ setUser }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="auth-page-wrapper">
            <div className="sticker sticker-1">🌸</div>
            <div className="sticker sticker-2">🎀</div>
            <div className="sticker sticker-3">💐</div>
            <div className="sticker sticker-4">💖</div>
            <div className="sticker sticker-5">✨</div>
            <div className="sticker sticker-6">🌷</div>

            <div className="auth-container">
                <h1 className="scholarship-hero">Women's Day Scholarship Exam</h1>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass auth-page" style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>Login</h2>
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
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="auth-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
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
        </div>
    );
};

export default LoginPage;
