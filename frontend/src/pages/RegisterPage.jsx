import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = ({ setUser }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/auth/register', { ...formData, role: 'STUDENT' });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '120px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass auth-page">
                <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Student Registration</h1>
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
                        <label className="auth-label">Password</label>
                        <input
                            type="password" required className="auth-input"
                            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button className="button-primary full-width">
                        <UserPlus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Create Student Account
                    </button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link to="/login" style={{ color: '#6366f1' }}>Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
