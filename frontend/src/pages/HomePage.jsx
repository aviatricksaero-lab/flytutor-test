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

        const timer = setInterval(() => {
            const now = new Date();
            const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const hrs = istTime.getHours();
            const mins = istTime.getMinutes();

            if (hrs === 16 || (hrs === 17 && mins < 30)) {
                setIsExamWindow(true);
                setCountdown("EXAM IS LIVE NOW! 🎯");
            } else {
                setIsExamWindow(false);
                let target = new Date(istTime);
                if (hrs > 17 || (hrs === 17 && mins >= 30)) target.setDate(target.getDate() + 1);
                target.setHours(16, 0, 0, 0);

                const diff = target - istTime;
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setCountdown(`${h}h ${m}m ${s}s until 04:00 PM Exam`);
            }
        }, 1000);

        return () => clearInterval(timer);
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
                    background: isExamWindow ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(90deg, #ec4899 0%, #d946ef 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    borderRadius: '20px',
                    boxShadow: isExamWindow ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
                }}
            >
                <div style={{ fontSize: '2.5rem' }}>{isExamWindow ? '🎯' : '✨'}</div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{isExamWindow ? 'Exam Window Open!' : 'Happy Women\'s Day! 🌸'}</h2>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                        {isExamWindow
                            ? 'The scholarship exam is now ACTIVE. Please proceed immediately.'
                            : 'To all the amazing women, you are inspiring, powerful, and fearless. Shine on!'}
                    </p>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '20px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>Next Scheduled Exam</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{countdown}</div>
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
                                isExamWindow ? (
                                    <Link to={`/test/${item._id}`} style={{ flex: 1 }}>
                                        <button className="button-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Start Exam</button>
                                    </Link>
                                ) : (
                                    <button
                                        className="button-primary"
                                        style={{ flex: 1, width: '100%', fontSize: '0.85rem', opacity: 0.5, cursor: 'not-allowed', background: '#ccc' }}
                                        onClick={() => alert("Exams can only be started between 04:00 PM and 05:30 PM.")}
                                    >
                                        Locked
                                    </button>
                                )
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{
                                        background: 'rgba(16,185,129,0.1)',
                                        color: '#047857',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        border: '1px solid rgba(16,185,129,0.2)'
                                    }}>
                                        Score: {item.mySubmission.score} / {item.questions.length}
                                    </div>
                                    <button
                                        className="button-primary"
                                        style={{ width: '100%', fontSize: '0.85rem', background: 'rgba(0,0,0,0.05)', color: '#1f2937', border: '1px solid rgba(0,0,0,0.1)' }}
                                        onClick={() => alert(`Registration confirmed. Score: ${item.mySubmission.score} / ${item.questions.length}`)}
                                    >
                                        Detailed Review
                                    </button>
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
