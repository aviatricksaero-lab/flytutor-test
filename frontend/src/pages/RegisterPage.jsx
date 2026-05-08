import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = ({ setUser }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', college: '', department: '', year: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.phone || formData.phone.length < 10) {
            setError('Please enter a valid phone number (e.g. 9876543210)');
            return;
        }

        let formattedPhone = formData.phone.replace(/\s+/g, '');
        if (formattedPhone && !/^\d{10}$/.test(formattedPhone)) {
            return setError('Please enter a valid 10-digit phone number.');
        }
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
            localStorage.setItem('userId', data.user._id);
            setUser(data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                <h1 className="scholarship-hero">Interview Portal</h1>
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
                                type="text"
                                required
                                className="auth-input"
                                placeholder="Enter your 10-digit phone number"
                                value={formData.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setFormData({ ...formData, phone: val });
                                }}
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
                        <div className="auth-form-group">
                            <label className="auth-label">College / University</label>
                            <input
                                type="text"
                                required
                                className="auth-input"
                                placeholder="Enter your college name"
                                value={formData.college}
                                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="auth-form-group">
                                <label className="auth-label">Department</label>
                                <input
                                    type="text"
                                    required
                                    className="auth-input"
                                    placeholder="e.g. CSE, ECE"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <div className="auth-form-group">
                                <label className="auth-label">Year of Study</label>
                                <select
                                    required
                                    className="auth-input"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                >
                                    <option value="">Select Year</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                </select>
                            </div>
                        </div>
                        {error && <p className="auth-error">{error}</p>}
                        <button type="submit" className="button-primary full-width">
                            <UserPlus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Create Student Account
                        </button>
                    </form>
                    <div className="auth-footer">
                        Already have an account? <Link to="/login" style={{ color: '#3b82f6' }}>Login</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterPage;
