import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';

const Navbar = ({ user, handleLogout }) => (
    <nav>
        <div className="nav-brand">
            <div className="nav-icon-bg">
                <ShieldAlert size={20} color="white" />
            </div>
            <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
                <h2 className="nav-title">Flytutor</h2>
            </Link>
        </div>

        {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className="nav-user-info">
                    Welcome, <span className="nav-user-name">{user.name}</span>
                    <span className="nav-role-badge">{user.role}</span>
                </div>

                <div className="nav-links">
                    <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
                    {user.role === 'ADMIN' && (
                        <Link to="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Admin</Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="nav-btn-logout"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>
        ) : (
            <div style={{ display: 'flex', gap: '16px' }}>
                <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Login</Link>
                <Link to="/register" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Register</Link>
            </div>
        )}
    </nav>
);

export default Navbar;
