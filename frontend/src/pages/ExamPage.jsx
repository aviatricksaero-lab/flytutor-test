import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExamPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        window.history.pushState(null, null, window.location.pathname);
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.pathname);
            alert("Security Alert: System navigation locked during exam.");
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        axios.get('/api/assessments').then(res => {
            const selected = res.data.find(t => t._id === id);
            setTest(selected);
            setTimeLeft((selected.duration || 30) * 60);
        });
    }, [id]);

    useEffect(() => {
        if (timeLeft <= 0 && test) {
            if (!isFinished) handleSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, test, isFinished]);

    const handleSubmit = async () => {
        setIsFinished(true);
        try {
            await axios.post('/api/assessments/submit', { assessmentId: test._id, answers: Object.values(answers) });
            navigate('/');
        } catch (err) { alert("Submission failed."); }
    };

    if (!test) return <div className="container">Loading...</div>;

    const q = test.questions[currentQuestion];
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="exam-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div className="glass" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                        <div>
                            <h1>{test.title}</h1>
                            <p style={{ opacity: 0.5 }}>Question {currentQuestion + 1} of {test.questions.length}</p>
                        </div>
                        <div className="timer-pill">Time Left: {formatTime(timeLeft)}</div>
                    </div>

                    <div className="question-box">
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>{q.text}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {q.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className={`option-button ${answers[currentQuestion] === idx ? 'selected' : ''}`}
                                    onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                        <button className="button-primary" onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))} disabled={currentQuestion === 0}>Back</button>
                        {currentQuestion === test.questions.length - 1 ? (
                            <button className="button-primary" onClick={handleSubmit}>Finish</button>
                        ) : (
                            <button className="button-primary" onClick={() => setCurrentQuestion(prev => prev + 1)}>Next</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamPage;
