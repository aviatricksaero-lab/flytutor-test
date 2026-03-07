import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, ClipboardList, FileText, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = ({ user }) => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/assessments')
            .then(res => setAssessments(res.data))
            .finally(() => setLoading(false));
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
                    background: 'linear-gradient(90deg, #ec4899 0%, #d946ef 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    borderRadius: '20px'
                }}
            >
                <div style={{ fontSize: '2.5rem' }}>✨</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Happy Women's Day! 🌸</h2>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>To all the amazing women, you are inspiring, powerful, and fearless. Shine on!</p>
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
                                <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(236,72,153,0.1)', color: '#ec4899', borderRadius: '4px', height: 'fit-content' }}>Pending</span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6, height: '3em', overflow: 'hidden' }}>{item.description}</p>

                        <div style={{ display: 'flex', gap: '16px', color: 'rgba(31,41,55,0.6)', fontSize: '0.8rem', margin: '20px 0' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ClipboardList size={14} /> {item.questions?.length} Items</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> Trainer: {item.trainer?.name}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!item.hasSubmitted ? (
                                <Link to={`/test/${item._id}`} style={{ flex: 1 }}>
                                    <button className="button-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Start Exam</button>
                                </Link>
                            ) : (
                                <button
                                    className="button-primary"
                                    style={{ flex: 1, fontSize: '0.85rem', background: 'rgba(0,0,0,0.05)', color: '#1f2937', border: '1px solid rgba(0,0,0,0.1)' }}
                                    onClick={() => alert(`Your Score: ${item.mySubmission.score} / ${item.questions.length}`)}
                                >
                                    View Score
                                </button>
                            )}
                            {item.pdfUrl && (
                                <button
                                    className="button-primary"
                                    style={{ background: 'transparent', border: '1px solid #ec4899', color: '#ec4899', padding: '10px' }}
                                    onClick={() => window.open(item.pdfUrl.startsWith('http') ? item.pdfUrl : `http://localhost:5000${item.pdfUrl}`, '_blank')}
                                >
                                    <Eye size={16} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default HomePage;
