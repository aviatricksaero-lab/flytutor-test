import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Seeded random shuffle helper
const seededShuffle = (array, seed) => {
    let m = array.length, t, i;
    // Simple numeric seed from string
    let seedNum = 0;
    for (let char of (seed || "default")) seedNum += char.charCodeAt(0);
    
    while (m) {
        i = Math.floor((Math.abs(Math.sin(seedNum++)) * m--));
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
};

const ExamPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [mcqSubmitted, setMcqSubmitted] = useState(false);
    const [projects, setProjects] = useState([{ title: '', description: '' }]);
    const [resumeFile, setResumeFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

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
        const now = new Date();
        
        axios.get('/api/assessments').then(res => {
            const selected = res.data.find(t => t._id === id);

            if (!selected) {
                navigate('/');
                return;
            }

            if (selected.hasSubmitted) {
                alert("You have already completed this assessment.");
                navigate('/');
                return;
            }

            // Add original index and perform a seeded shuffle based on the user ID
            // (Assumes user ID is available or use a fallback)
            const userId = localStorage.getItem('userId') || 'guest';
            const indexedQuestions = selected.questions.map((q, idx) => ({ ...q, originalIndex: idx }));
            const shuffled = seededShuffle([...indexedQuestions], userId);
            
            setShuffledQuestions(shuffled);
            setTest(selected);
            setTimeLeft((selected.duration || 30) * 60);
        });
    }, [id]);

    const handleSubmit = async (forced = false) => {
        if (isFinishedRef.current) return;

        // Map shuffled answers back to original indices
        const originalAnswers = {};
        Object.keys(answers).forEach(shuffledIdx => {
            const originalIdx = shuffledQuestions[shuffledIdx].originalIndex;
            originalAnswers[originalIdx] = answers[shuffledIdx];
        });

        // If forced (Time/Security), submit everything at once as before
        if (forced) {
            setIsFinished(true);
            isFinishedRef.current = true;
            try {
                await axios.post('/api/assessments/submit', {
                    assessmentId: id,
                    answers: originalAnswers,
                    projects: [{ title: "N/A (Forced)", description: "N/A (Forced)" }]
                });
                alert(forced === "TIME" ? "🚨 TIME EXPIRED: Your exam was automatically submitted." : "🚨 EXAM TERMINATED: Too many security violations.");
                navigate('/');
            } catch (err) {
                navigate('/');
            }
            return;
        }

        // Normal Flow: Submit MCQs first
        try {
            await axios.post('/api/assessments/submit', {
                assessmentId: id,
                answers: originalAnswers
            });
            setMcqSubmitted(true);
            setShowProjectForm(true);
            // We DON'T set isFinished=true yet because we want them to fill the project form
            // But we will stop the timer by checking mcqSubmitted in the useEffect
        } catch (err) {
            alert("Submission failed. Please check your internet and try again.");
        }
    };

    const handleProjectSubmit = async () => {
        setIsUploading(true);
        try {
            // 1. Upload Resume if exists
            if (resumeFile) {
                const formData = new FormData();
                formData.append('resume', resumeFile);
                formData.append('assessmentId', id);
                await axios.post('/api/assessments/upload-resume', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Update Projects
            await axios.post('/api/assessments/update-project', {
                assessmentId: id,
                projects: projects
            });
            
            setIsFinished(true);
            isFinishedRef.current = true;
            alert("✅ Assessment completed successfully! Your resume and project details have been recorded.");
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("Failed to complete submission. Please check your file size and internet.");
        } finally {
            setIsUploading(false);
        }
    };

    // --- HIGH SECURITY MONITORING ---
    useEffect(() => {
        if (!test || isFinished || mcqSubmitted) return;

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
    }, [test, isFinished, mcqSubmitted]);

    // Timer logic
    useEffect(() => {
        if (!test || isFinished || mcqSubmitted) return;

        if (timeLeft <= 0) {
            handleSubmit("TIME");
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, test, isFinished, mcqSubmitted]);

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

    if (!isFullscreen) {
        return (
            <div className="auth-page-wrapper">
                <div className="container" style={{ maxWidth: '600px', marginTop: '0', textAlign: 'center', zIndex: 2 }}>
                    <div className="glass" style={{ padding: '40px' }}>
                        <ShieldCheck size={64} color="#3b82f6" style={{ marginBottom: '24px' }} />
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

    const q = shuffledQuestions[currentQuestion];
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (!q) return <div className="container">Preparing questions...</div>;

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
                            {!mcqSubmitted ? (
                                <p style={{ opacity: 0.5, margin: 0 }}>Question {currentQuestion + 1} of {test.questions.length}</p>
                            ) : (
                                <p style={{ color: '#10b981', margin: 0, fontWeight: 'bold' }}>MCQs Submitted ✅</p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {warnings > 0 && !mcqSubmitted && (
                                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                                    ⚠️ {warnings} / {MAX_WARNINGS} Warnings
                                </div>
                            )}
                            {!mcqSubmitted && (
                                <div className="timer-pill" style={{ background: timeLeft < 300 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', color: timeLeft < 300 ? '#ef4444' : '#3b82f6' }}>
                                    Time Left: {formatTime(timeLeft)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="question-box">
                        {showProjectForm ? (
                            <div className="glass" style={{ padding: '24px', border: '1px solid rgba(59,130,246,0.3)', maxHeight: '500px', overflowY: 'auto' }}>
                                <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Final Step: Project Details</h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '24px' }}>
                                    Please mention projects you have worked on. You can add multiple projects.
                                </p>

                                {projects.map((proj, index) => (
                                    <div key={index} style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: index < projects.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Project #{index + 1}</h4>
                                            {projects.length > 1 && (
                                                <button 
                                                    onClick={() => setProjects(projects.filter((_, i) => i !== index))}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="auth-form-group">
                                            <label className="auth-label">Project Title</label>
                                            <input 
                                                type="text" 
                                                className="auth-input" 
                                                placeholder="Enter project name"
                                                value={proj.title}
                                                onChange={e => {
                                                    const newProjects = [...projects];
                                                    newProjects[index].title = e.target.value;
                                                    setProjects(newProjects);
                                                }}
                                            />
                                        </div>
                                        <div className="auth-form-group">
                                            <label className="auth-label">Project Description</label>
                                            <textarea 
                                                className="auth-input" 
                                                rows="3" 
                                                placeholder="Describe your role and the technology used..."
                                                style={{ resize: 'none', padding: '12px' }}
                                                value={proj.description}
                                                onChange={e => {
                                                    const newProjects = [...projects];
                                                    newProjects[index].description = e.target.value;
                                                    setProjects(newProjects);
                                                }}
                                            ></textarea>
                                        </div>
                                    </div>
                                ))}

                                <button 
                                    onClick={() => setProjects([...projects, { title: '', description: '' }])}
                                    style={{ background: 'none', border: '1px dashed #3b82f6', color: '#3b82f6', padding: '12px', borderRadius: '8px', width: '100%', cursor: 'pointer', marginBottom: '32px' }}
                                >
                                    + Add Another Project
                                </button>

                                <div className="glass" style={{ padding: '20px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Upload Your Resume (PDF)</h4>
                                    <input 
                                        type="file" 
                                        accept=".pdf"
                                        onChange={e => setResumeFile(e.target.files[0])}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                    {resumeFile && (
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#10b981' }}>
                                            Selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                        {showProjectForm ? (
                            <button
                                className="button-primary"
                                style={{ 
                                    background: (projects.every(p => p.title && p.description) && !isUploading) ? '#10b981' : '#4b5563',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                                onClick={handleProjectSubmit}
                                disabled={!projects.every(p => p.title && p.description) || isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Save & Submit Application'}
                            </button>
                        ) : (
                            currentQuestion === shuffledQuestions.length - 1 ? (
                                <button
                                    className="button-primary"
                                    style={{ background: answers[currentQuestion] !== undefined ? '#3b82f6' : '#4b5563', cursor: answers[currentQuestion] !== undefined ? 'pointer' : 'not-allowed' }}
                                    onClick={() => handleSubmit(false)}
                                    disabled={answers[currentQuestion] === undefined}
                                >
                                    Proceed to Project Details
                                </button>
                            ) : (
                                <button
                                    className="button-primary"
                                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                                    style={{ background: answers[currentQuestion] !== undefined ? '#3b82f6' : '#4b5563', cursor: answers[currentQuestion] !== undefined ? 'pointer' : 'not-allowed' }}
                                    disabled={answers[currentQuestion] === undefined}
                                >
                                    Next Question
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamPage;
