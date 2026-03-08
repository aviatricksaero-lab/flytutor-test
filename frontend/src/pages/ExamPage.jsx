import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExamPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [timeError, setTimeError] = useState(false);

    // High Secure Variables
    const [warnings, setWarnings] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBlurred, setIsBlurred] = useState(false); // Used to obscure content when unfocused
    const MAX_WARNINGS = 2; // Auto-submit on 3rd violation

    const answersRef = useRef(answers);
    const isFinishedRef = useRef(isFinished);

    useEffect(() => {
        answersRef.current = answers;
        isFinishedRef.current = isFinished;
    }, [answers, isFinished]);

    // Fetch Assessment
    useEffect(() => {
        // Time Validation: 11 AM to 12 PM check
        const now = new Date();
        const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const hrs = istTime.getHours();
        if (hrs < 11 || hrs >= 12) {
            setTimeError(true);
        }

        axios.get('/api/assessments').then(res => {
            const selected = res.data.find(t => t._id === id);
            setTest(selected);

            // Calculate time left: Min of (Duration) or (Time until 12 PM IST)
            const testDurationSeconds = (selected.duration || 30) * 60;
            const endWindow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            endWindow.setHours(12, 0, 0, 0);
            const secondsUntil12pm = Math.floor((endWindow - new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))) / 1000);

            // Set whichever is shorter
            setTimeLeft(Math.min(testDurationSeconds, secondsUntil12pm));
        });
    }, [id]);

    const handleSubmit = async (forced = false) => {
        if (isFinishedRef.current) return;
        setIsFinished(true);
        isFinishedRef.current = true;
        try {
            await axios.post('/api/assessments/submit', {
                assessmentId: id,
                answers: Object.values(answersRef.current)
            });
            if (forced === "TIME") {
                alert("🚨 TIME EXPIRED: The 12:00 PM deadline has been reached. Your exam was automatically submitted.");
            } else if (forced) {
                alert("🚨 EXAM TERMINATED: Too many security violations.");
            } else {
                alert("✅ Exam submitted successfully.");
            }
            navigate('/');
        } catch (err) {
            alert("Submission failed.");
            navigate('/');
        }
    };

    // --- HIGH SECURITY MONITORING ---
    useEffect(() => {
        if (!test || isFinished) return;

        // 1. Prevent back button
        window.history.pushState(null, null, window.location.pathname);
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.pathname);
            triggerWarning('System navigation (Back/Forward) is locked during the exam.');
        };

        // 2. Prevent refresh / tab close
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "You have an ongoing exam. Are you sure you want to leave? Your progress will be lost.";
            return e.returnValue;
        };

        // 3. Tab switching / minimization (Visibility Change)
        const handleVisibilityChange = () => {
            if (document.hidden && !isFinishedRef.current) {
                triggerWarning('You switched tabs or minimized the browser. This is recorded as a security violation.');
            }
        };

        // 3.5 Obscure screen when window loses focus (Anti-Snipping & Anti-Screenshot)
        const handleBlur = () => {
            if (!isFinishedRef.current) setIsBlurred(true);
        };
        const handleFocus = () => setIsBlurred(false);

        // 4. Prevent Copy, Cut, Paste
        const handleCopyPaste = (e) => {
            e.preventDefault();
        };

        // 5. Prevent Right Click (Context Menu)
        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        // 6. Prevent Screenshot Key Combos (PrintScreen, Cmd+Shift+3/4, Win+Shift+S)
        const handleKeyDown = (e) => {
            // Block Print Screen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                navigator.clipboard.writeText(''); // Clear clipboard just in case
                triggerWarning('Screenshots are strictly prohibited!');
            }
            // Block Mac Shift+Cmd+S/3/4/5
            if (e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S' || ['3', '4', '5'].includes(e.key))) {
                e.preventDefault();
                navigator.clipboard.writeText('');
                triggerWarning('Screenshot shortcut detected. This is a security violation!');
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                navigator.clipboard.writeText('');
            }
        };

        // Attach listeners
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [test, isFinished]);

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0 && test) {
            if (!isFinished) handleSubmit("TIME");
            return;
        }
        const timer = setInterval(() => {
            // Hard check for 12:00 PM IST
            const now = new Date();
            const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            if (istTime.getHours() >= 12) {
                if (!isFinished) handleSubmit("TIME");
                return;
            }
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, test, isFinished]);

    const triggerWarning = (reason) => {
        if (isFinishedRef.current) return;
        setWarnings(prev => {
            const newWarnings = prev + 1;
            if (newWarnings > MAX_WARNINGS) {
                handleSubmit(true); // Force submit
            } else {
                setShowWarningModal(reason);
            }
            return newWarnings;
        });
    };

    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log(err));
        }
        setIsFullscreen(true);
    };

    if (!test) return <div className="container">Loading Exam...</div>;

    if (timeError) {
        return (
            <div className="auth-page-wrapper">
                <div className="sticker sticker-1">🦋</div>
                <div className="sticker sticker-2">🍀</div>
                <div className="sticker sticker-3">🌟</div>
                <div className="sticker sticker-4">💖</div>
                <div className="container" style={{ maxWidth: '600px', textAlign: 'center', zIndex: 2 }}>
                    <div className="glass" style={{ padding: '40px' }}>
                        <Clock size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
                        <h2 style={{ marginBottom: '16px' }}>Access Restricted</h2>
                        <p style={{ marginBottom: '32px', opacity: 0.8 }}>This exam is only available between **11:00 AM** and **12:00 PM** MORNING.</p>
                        <button className="button-primary full-width" onClick={() => navigate('/')}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isFullscreen) {
        return (
            <div className="auth-page-wrapper">
                <div className="sticker sticker-1">🦋</div>
                <div className="sticker sticker-2">🍀</div>
                <div className="sticker sticker-3">🌟</div>
                <div className="sticker sticker-4">💖</div>
                <div className="container" style={{ maxWidth: '600px', marginTop: '0', textAlign: 'center', zIndex: 2 }}>
                    <div className="glass" style={{ padding: '40px' }}>
                        <ShieldCheck size={64} color="#ec4899" style={{ marginBottom: '24px' }} />
                        <h2 style={{ marginBottom: '16px' }}>High-Security Exam Protocol</h2>
                        <ul style={{ textAlign: 'left', marginBottom: '32px', opacity: 0.8, lineHeight: '1.8' }}>
                            <li>Do <strong>not</strong> switch tabs or minimize the browser.</li>
                            <li>Do <strong>not</strong> refresh or exit the page.</li>
                            <li>Copy, paste, and right-click are <strong>disabled</strong>.</li>
                            <li>Screenshots and screen recording are <strong>strictly prohibited</strong>.</li>
                            <li>Violation of these rules will result in auto-submission and termination.</li>
                        </ul>
                        <button className="button-primary full-width" onClick={enterFullscreen}>
                            I Understand, Enter Fullscreen & Start Exam
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const q = test.questions[currentQuestion];
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', userSelect: 'none' }}>

            {/* Anti-screenshot Obscure Overlay */}
            {isBlurred && !isFinished && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: '#000', zIndex: 10000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                }}>
                    <ShieldCheck size={80} color="#ef4444" style={{ marginBottom: '24px' }} />
                    <h1 style={{ color: '#ef4444' }}>Security Lock Active</h1>
                    <p style={{ opacity: 0.7, marginTop: '8px' }}>Click anywhere to resume your exam.</p>
                </div>
            )}

            {/* Warning Modal */}
            <AnimatePresence>
                {showWarningModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ zIndex: 9999 }}>
                        <div className="glass modal-content" style={{ border: '2px solid #ef4444', textAlign: 'center' }}>
                            <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '16px' }} />
                            <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Security Violation Detected!</h2>
                            <p style={{ marginBottom: '8px' }}>{showWarningModal}</p>
                            <p style={{ marginBottom: '24px', opacity: 0.7 }}>
                                Warning {warnings} out of {MAX_WARNINGS}. Your exam will be automatically terminated upon {(MAX_WARNINGS + 1)} violations.
                            </p>
                            <button className="button-primary full-width" style={{ background: '#ef4444' }} onClick={() => {
                                setShowWarningModal(false);
                                enterFullscreen(); // re-enter fullscreen if they exited
                            }}>
                                Acknowledge & Return to Exam
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="exam-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div className="glass" style={{ padding: '32px', borderTop: '4px solid #ec4899' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{test.title}</h1>
                            <p style={{ opacity: 0.5, margin: 0 }}>Question {currentQuestion + 1} of {test.questions.length}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {warnings > 0 && (
                                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                                    ⚠️ {warnings} / {MAX_WARNINGS} Warnings
                                </div>
                            )}
                            <div className="timer-pill" style={{ background: timeLeft < 300 ? 'rgba(239,68,68,0.2)' : 'rgba(236,72,153,0.2)', color: timeLeft < 300 ? '#ef4444' : '#ec4899' }}>
                                Time Left: {formatTime(timeLeft)}
                            </div>
                        </div>
                    </div>

                    <div className="question-box">
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '32px', lineHeight: '1.5' }}>{currentQuestion + 1}. {q.text}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {q.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className={`option-button ${answers[currentQuestion] === idx ? 'selected' : ''}`}
                                    onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })}
                                >
                                    <span style={{ fontWeight: 'bold', marginRight: '16px', opacity: 0.5 }}>{String.fromCharCode(65 + idx)}.</span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                        {currentQuestion === test.questions.length - 1 ? (
                            <button
                                className="button-primary"
                                style={{ background: answers[currentQuestion] !== undefined ? '#10b981' : '#4b5563', cursor: answers[currentQuestion] !== undefined ? 'pointer' : 'not-allowed' }}
                                onClick={() => handleSubmit(false)}
                                disabled={answers[currentQuestion] === undefined}
                            >
                                Finish Exam
                            </button>
                        ) : (
                            <button
                                className="button-primary"
                                onClick={() => setCurrentQuestion(prev => prev + 1)}
                                style={{ background: answers[currentQuestion] !== undefined ? '#ec4899' : '#4b5563', cursor: answers[currentQuestion] !== undefined ? 'pointer' : 'not-allowed' }}
                                disabled={answers[currentQuestion] === undefined}
                            >
                                Next Question
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamPage;
