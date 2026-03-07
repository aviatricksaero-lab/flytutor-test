import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = ({ setUser }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.phone || formData.phone.length < 10) {
            setError('Please enter a valid phone number (e.g. 9876543210)');
            return;
        }

        let formattedPhone = formData.phone.trim();
        if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
            formattedPhone = '+91' + formattedPhone;
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }

        try {
            const { data } = await axios.post('/api/auth/register', {
                ...formData,
                email: formData.email.toLowerCase().trim(),
                phone: formattedPhone,
                role: 'STUDENT'
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="sticker sticker-1">🌷</div>
            <div className="sticker sticker-2">💕</div>
            <div className="sticker sticker-3">🏵️</div>
            <div className="sticker sticker-4">💄</div>
            <div className="sticker sticker-5">🌸</div>
            <div className="sticker sticker-6">💐</div>

            <div className="auth-container">
                <h1 className="scholarship-hero">Women's Day Scholarship Exam</h1>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass auth-page" style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>Student Registration</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="auth-form-group">
                            <label className="auth-label">Full Name</label>
                            <input
                                type="text" required className="auth-input"
                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-label">Email Address</label>
                            <input
                                type="email" required className="auth-input"
                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-label">Phone Number</label>
                            <input
                                type="tel" required className="auth-input"
                                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-label">Password</label>
                            <input
                                type="password" required className="auth-input"
                                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        {error && <p className="auth-error">{error}</p>}
                        <button type="submit" className="button-primary full-width">
                            <UserPlus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Create Student Account
                        </button>
                    </form>
                    <div className="auth-footer">
                        Already have an account? <Link to="/login" style={{ color: '#ec4899' }}>Login</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterPage;
