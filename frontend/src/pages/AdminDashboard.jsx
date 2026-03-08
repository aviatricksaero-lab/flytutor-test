import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ShieldCheck, Users, FileText, Upload, CheckCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
    const [tab, setTab] = useState('upload');
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [pdfFileName, setPdfFileName] = useState('');
    const [keyFileName, setKeyFileName] = useState('');
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('30');
    const pdfRef = useRef();
    const keyRef = useRef();

    const refreshData = () => {
        axios.get('/api/admin/submissions').then(res => setReports(res.data)).catch(() => { });
        axios.get('/api/admin/users').then(res => setUsers(res.data)).catch(() => { });
        axios.get('/api/admin/tests').then(res => setTests(res.data)).catch(() => { });
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? All their submissions will be erased.")) return;
        try {
            await axios.delete(`/api/admin/users/${id}`);
            refreshData();
        } catch (err) { alert(err.response?.data?.error || "Error deleting user"); }
    };

    const handleDeleteTest = async (id) => {
        if (!window.confirm("Are you sure you want to delete this test? The PDF and all student submissions will be completely removed.")) return;
        try {
            await axios.delete(`/api/admin/tests/${id}`);
            refreshData();
        } catch (err) { alert(err.response?.data?.error || "Error deleting test"); }
    };

    useEffect(() => { refreshData(); }, []);

    const handlePublish = async () => {
        if (!title.trim()) return setUploadStatus('❌ Please enter a test title.');
        if (!pdfRef.current?.files[0]) return setUploadStatus('❌ Please select a PDF file.');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('duration', duration);
        formData.append('pdfFile', pdfRef.current.files[0]);
        if (keyRef.current?.files[0]) {
            formData.append('answerKey', keyRef.current.files[0]);
        }

        setIsUploading(true);
        setUploadStatus('⏳ Parsing PDF & extracting questions...');
        try {
            const { data } = await axios.post('/api/admin/tests/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus(`✅ Success! "${data.title}" created with ${data.questionsExtracted} questions.`);
            setTitle('');
            setDuration('30');
            setPdfFileName('');
            setKeyFileName('');
            if (pdfRef.current) pdfRef.current.value = '';
            if (keyRef.current) keyRef.current.value = '';
            refreshData();
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Unknown error';
            setUploadStatus(`❌ ${msg}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleExportExcel = () => {
        if (reports.length === 0) return alert("No reports to export.");

        // Prepare data for Excel
        const data = reports.map(r => ({
            "Student Name": r.student?.name || "N/A",
            "Student Email": r.student?.email || "N/A",
            "Assessment Title": r.assessment?.title || "N/A",
            "Score": r.score,
            "Total Questions": r.assessment?.questions?.length || 0,
            "Percentage": (((r.score || 0) / (r.assessment?.questions?.length || 1)) * 100).toFixed(2) + "%",
            "Submission Date": new Date(r.createdAt).toLocaleString('en-IN')
        }));

        // Create sheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

        // Download file
        XLSX.writeFile(workbook, `Assessment_Results_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="container" style={{ maxWidth: '1200px', position: 'relative' }}>
            <div className="sticker sticker-1" style={{ position: 'fixed', left: '20px', top: '20%' }}>🌸</div>
            <div className="sticker sticker-2" style={{ position: 'fixed', right: '20px', top: '15%' }}>✨</div>
            <div className="sticker sticker-3" style={{ position: 'fixed', left: '30px', bottom: '10%' }}>💝</div>
            <div className="sticker sticker-4" style={{ position: 'fixed', right: '30px', bottom: '15%' }}>🌺</div>
            <div className="sticker sticker-5" style={{ position: 'fixed', left: '10px', top: '45%' }}>🌷</div>
            <div className="sticker sticker-6" style={{ position: 'fixed', right: '15px', top: '55%' }}>🎀</div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
                {[
                    { key: 'upload', label: 'Create Exam', icon: <Upload size={18} /> },
                    { key: 'tests', label: 'Manage Tests', icon: <FileText size={18} /> },
                    { key: 'reports', label: 'Test Reports', icon: <ShieldCheck size={18} /> },
                    { key: 'users', label: 'All Students', icon: <Users size={18} /> },
                ].map(t => (
                    <button
                        key={t.key}
                        className="button-primary"
                        style={{
                            flex: 1,
                            background: tab === t.key
                                ? 'linear-gradient(135deg, #ec4899, #d946ef)'
                                : 'rgba(0,0,0,0.05)',
                            color: tab === t.key ? '#fff' : '#1f2937',
                            border: '1px solid rgba(0,0,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                        onClick={() => setTab(t.key)}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ═══ CREATE EXAM TAB ═══ */}
                {tab === 'upload' && (
                    <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '40px' }}>
                        <h2 style={{ marginBottom: '8px' }}>Upload Question Paper</h2>
                        <p style={{ opacity: 0.5, marginBottom: '32px', fontSize: '0.9rem' }}>
                            Upload your MCQ PDF — questions are automatically extracted from it.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, fontSize: '0.85rem' }}>Test Title *</label>
                                <input
                                    type="text"
                                    className="auth-input"
                                    placeholder="e.g. Ground School Module 1"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, fontSize: '0.85rem' }}>Duration (Minutes) *</label>
                                <input
                                    type="number"
                                    className="auth-input"
                                    value={duration}
                                    min="5"
                                    max="180"
                                    onChange={e => setDuration(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* PDF Upload */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, fontSize: '0.85rem' }}>Question Paper PDF *</label>
                            <div
                                className="glass"
                                style={{
                                    padding: '48px 20px', textAlign: 'center', cursor: 'pointer',
                                    border: pdfFileName ? '2px solid #10b981' : '2px dashed rgba(0,0,0,0.15)',
                                    borderRadius: '16px', transition: 'all 0.2s'
                                }}
                                onClick={() => pdfRef.current.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type === 'application/pdf') {
                                        pdfRef.current.files = e.dataTransfer.files;
                                        setPdfFileName(file.name);
                                    }
                                }}
                            >
                                {pdfFileName ? (
                                    <>
                                        <CheckCircle size={40} color="#10b981" style={{ marginBottom: '12px' }} />
                                        <p style={{ margin: 0, color: '#10b981', fontWeight: 600 }}>{pdfFileName}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.5 }}>Click to change</p>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>Drag & drop or click to upload PDF</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.5 }}>
                                            Questions will be auto-extracted from the PDF
                                        </p>
                                    </>
                                )}
                                <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }}
                                    onChange={e => setPdfFileName(e.target.files[0]?.name || '')} />
                            </div>

                            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(236,72,153,0.05)', borderRadius: '12px', border: '1px solid rgba(236,72,153,0.2)' }}>
                                <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.7 }}>
                                    <strong>📋 Supported PDF Format:</strong><br />
                                    1. What is the capital of France?<br />
                                    A) Paris&nbsp;&nbsp;&nbsp;B) London&nbsp;&nbsp;&nbsp;C) Berlin&nbsp;&nbsp;&nbsp;D) Rome<br />
                                    Answer: A
                                </p>
                            </div>
                        </div>

                        {/* Answer Key Upload */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, fontSize: '0.85rem' }}>Answer Key PDF (Optional)</label>
                            <div
                                className="glass"
                                style={{
                                    padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                                    border: keyFileName ? '2px solid #10b981' : '2px dashed rgba(0,0,0,0.15)',
                                    borderRadius: '16px', transition: 'all 0.2s'
                                }}
                                onClick={() => keyRef.current.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type === 'application/pdf') {
                                        keyRef.current.files = e.dataTransfer.files;
                                        setKeyFileName(file.name);
                                    }
                                }}
                            >
                                {keyFileName ? (
                                    <>
                                        <CheckCircle size={32} color="#10b981" style={{ marginBottom: '8px' }} />
                                        <p style={{ margin: 0, color: '#10b981', fontWeight: 600 }}>{keyFileName}</p>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>Drag & drop or click Answer Key</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.5 }}>
                                            Optional: override answers via separate PDF
                                        </p>
                                    </>
                                )}
                                <input ref={keyRef} type="file" accept=".pdf" style={{ display: 'none' }}
                                    onChange={e => setKeyFileName(e.target.files[0]?.name || '')} />
                            </div>
                        </div>

                        <button
                            className="button-primary"
                            style={{ width: '100%', background: '#10b981', padding: '16px', fontSize: '1rem', opacity: isUploading ? 0.7 : 1 }}
                            onClick={handlePublish}
                            disabled={isUploading}
                        >
                            <Upload size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {isUploading ? 'Processing PDF...' : 'Upload & Publish Assessment'}
                        </button>

                        {uploadStatus && (
                            <div style={{
                                marginTop: '20px', padding: '16px', borderRadius: '12px',
                                background: uploadStatus.includes('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                border: `1px solid ${uploadStatus.includes('❌') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                textAlign: 'center', fontSize: '0.9rem'
                            }}>
                                {uploadStatus}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ═══ REPORTS TAB ═══ */}
                {tab === 'reports' && (
                    <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ margin: 0 }}>Student Performance Reports</h2>
                            <button className="button-primary" style={{ background: '#10b981' }} onClick={handleExportExcel}>
                                <Download size={18} style={{ marginRight: '8px' }} /> Export to Excel
                            </button>
                        </div>
                        {reports.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No submissions yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {reports.map((r, idx) => (
                                    <div key={idx} className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0' }}>{r.student?.name}</h4>
                                            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.85rem' }}>
                                                {r.assessment?.title} &bull; Score: <strong style={{ color: '#10b981' }}>{r.score}</strong> / {r.assessment?.questions?.length}
                                            </p>
                                        </div>
                                        <button className="button-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => setSelectedSubmission(r)}>
                                            View Details
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ═══ MANAGE TESTS TAB ═══ */}
                {tab === 'tests' && (
                    <motion.div key="tests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '32px' }}>
                        <h2 style={{ marginBottom: '32px' }}>Manage Assessments ({tests.length})</h2>
                        {tests.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No tests available.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <th style={{ padding: '16px' }}>Title</th>
                                        <th style={{ padding: '16px' }}>Questions</th>
                                        <th style={{ padding: '16px' }}>Duration</th>
                                        <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tests.map((t, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding: '16px' }}>{t.title}</td>
                                            <td style={{ padding: '16px', opacity: 0.7 }}>{t.questions?.length || 0}</td>
                                            <td style={{ padding: '16px', opacity: 0.7 }}>{t.duration} min</td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteTest(t._id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </motion.div>
                )}

                {/* ═══ USERS TAB ═══ */}
                {tab === 'users' && (
                    <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '32px' }}>
                        <h2 style={{ marginBottom: '32px' }}>Registered Students ({users.length})</h2>
                        {users.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No users registered yet.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <th style={{ padding: '16px' }}>Name</th>
                                        <th style={{ padding: '16px' }}>Email</th>
                                        <th style={{ padding: '16px' }}>Role</th>
                                        <th style={{ padding: '16px' }}>Latest Score</th>
                                        <th style={{ padding: '16px' }}>Desired Mark</th>
                                        <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding: '16px' }}>{u.name}</td>
                                            <td style={{ padding: '16px', opacity: 0.7 }}>{u.email}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(236,72,153,0.1)', color: '#ec4899', borderRadius: '4px' }}>{u.role}</span>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 'bold' }}>
                                                {(() => {
                                                    const userSubmissions = reports.filter(r => r.student?._id === u._id);
                                                    if (userSubmissions.length === 0) return <span style={{ opacity: 0.3 }}>-</span>;
                                                    const latest = userSubmissions[0];
                                                    return <span style={{ color: '#10b981' }}>{latest.score} / {latest.assessment?.questions?.length}</span>;
                                                })()}
                                            </td>
                                            <td style={{ padding: '16px', opacity: 0.7 }}>
                                                {u.desiredMark ? (
                                                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{u.desiredMark}</span>
                                                ) : (
                                                    <span style={{ opacity: 0.5 }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                {u.role !== 'ADMIN' && (
                                                    <button onClick={() => handleDeleteUser(u._id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ DETAIL MODAL ═══ */}
            {selectedSubmission && (
                <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{selectedSubmission.student?.name}'s Answer Review</h2>
                        <p style={{ opacity: 0.5, marginBottom: '24px' }}>{selectedSubmission.assessment?.title}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedSubmission.detailedAnswers?.map((ans, i) => (
                                <div key={i} className="glass" style={{ padding: '16px 20px', borderLeft: `4px solid ${ans.isCorrect ? '#10b981' : '#ef4444'}` }}>
                                    <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>{i + 1}. {ans.question}</p>
                                    <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.7 }}>
                                        Student: <span style={{ color: ans.isCorrect ? '#10b981' : '#ef4444' }}>{ans.studentOption || 'Not Answered'}</span>
                                        {!ans.isCorrect && <> &nbsp;|&nbsp; Correct: <span style={{ color: '#10b981' }}>{ans.correctOption}</span></>}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <button className="button-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => setSelectedSubmission(null)}>Close</button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
