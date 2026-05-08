import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, ClipboardList, FileText, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = ({ user }) => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState("");
    const [isExamWindow, setIsExamWindow] = useState(false);

    useEffect(() => {
        axios.get('/api/assessments')
            .then(res => setAssessments(res.data))
            .finally(() => setLoading(false));

        setIsExamWindow(true); // Interviews are live by default in the portal
    }, []);

    if (loading) return <div className="container">Loading Assessments...</div>;

    return (
        <div className="container">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    padding: '20px 32px',
                    marginBottom: '40px',
                    background: isExamWindow ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    borderRadius: '20px',
                    boxShadow: isExamWindow ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'
                }}
            >
                <div style={{ fontSize: '2.5rem' }}>{isExamWindow ? '🎯' : '📝'}</div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{isExamWindow ? 'Interview Window Open!' : 'Interview Portal'}</h2>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                        {isExamWindow
                            ? 'The assessment window is now ACTIVE. Please proceed to your assigned interview test.'
                            : 'Welcome to the FlyTutor Interview Portal. Please check your assigned assessments below.'}
                    </p>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '20px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>System Status</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>ACTIVE</div>
                </div>
            </motion.div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Assessments Dashboard</h1>
                    <p style={{ opacity: 0.6 }}>Track your learning progress and upcoming exams.</p>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'TRAINER') && (
                    <Link to="/admin">
                        <button className="button-primary" style={{ background: '#10b981' }}>
                            <Plus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Create New
                        </button>
                    </Link>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {assessments.map(item => (
                    <motion.div key={item._id} className="glass test-card" whileHover={{ y: -5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0 }}>{item.title}</h3>
                            {item.hasSubmitted ? (
                                <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '4px', height: 'fit-content' }}>Completed</span>
                            ) : (
                                <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '4px', height: 'fit-content' }}>Pending</span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, height: '3em', overflow: 'hidden' }}>{item.description}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(31,41,55,0.6)', fontSize: '0.8rem', margin: '20px 0' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ClipboardList size={14} /> {item.questions?.length} Items</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> Trainer: {item.trainer?.name}</span>
                            </div>
                            {item.scheduledDate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontWeight: 600 }}>
                                    📅 {new Date(item.scheduledDate).toLocaleDateString()} at {item.scheduledTime}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!item.hasSubmitted ? (
                                (() => {
                                    const now = new Date();
                                    const scheduled = item.scheduledDate ? new Date(`${item.scheduledDate}T${item.scheduledTime || '00:00'}`) : null;
                                    const isTimeReached = !scheduled || now >= scheduled;

                                    if (isTimeReached) {
                                        return (
                                            <Link to={`/test/${item._id}`} style={{ flex: 1 }}>
                                                <button className="button-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Start Exam</button>
                                            </Link>
                                        );
                                    } else {
                                        return (
                                            <button
                                                className="button-primary"
                                                style={{ flex: 1, width: '100%', fontSize: '0.85rem', opacity: 0.5, cursor: 'not-allowed', background: '#94a3b8' }}
                                                onClick={() => alert(`This exam is scheduled for ${new Date(item.scheduledDate).toLocaleDateString()} at ${item.scheduledTime}.`)}
                                            >
                                                Scheduled
                                            </button>
                                        );
                                    }
                                })()
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        color: '#3b82f6',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        border: '1px solid rgba(59,130,246,0.2)'
                                    }}>
                                        ✅ Assessment Submitted Successfully
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5, textAlign: 'center' }}>
                                        Your interview results are being processed.
                                    </p>
                                </div>
                            )}

                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default HomePage;
