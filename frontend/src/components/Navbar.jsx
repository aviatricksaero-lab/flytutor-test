import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import logo from '../assets/aviatricks_logo.svg';

const Navbar = ({ user, handleLogout }) => (
    <nav>
        <div className="nav-brand">
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={logo} alt="Aviatricks Logo" style={{ height: '40px' }} />
                <h2 className="nav-title" style={{ color: '#1f2937' }}></h2>
            </Link>
        </div>

        {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className="nav-user-info">
                    Welcome, <span className="nav-user-name">{user.name}</span>
                    <span className="nav-role-badge">{user.role}</span>
                </div>

                <div className="nav-links">
                    <Link to="/" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
                    {user.role === 'ADMIN' && (
                        <Link to="/admin" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '0.9rem' }}>Admin</Link>
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
            null
        )}
    </nav>
);

export default Navbar;
