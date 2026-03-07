import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import connectDB from './config/db.js';
import admin from 'firebase-admin';
import User from './models/User.js';
import Assessment from './models/Assessment.js';
import Submission from './models/Submission.js';
import { extractQuestions } from './utils/extractQuestions.js';

dotenv.config();
connectDB();

// --- FIREBASE ADMIN INIT ---
let bucket = null;
try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    bucket = admin.storage().bucket();
    console.log('🔥 Firebase Storage connected:', process.env.FIREBASE_STORAGE_BUCKET);
  } else {
    console.warn('⚠️  Firebase env vars missing - PDF uploads disabled');
  }
} catch (e) {
  console.error('❌ Firebase init error:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer Storage (InMemory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'TRAINER') return res.status(403).send({ error: 'Access denied.' });
  next();
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password, role });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- ASSESSMENT ROUTES ---

app.get('/api/assessments', auth, async (req, res) => {
  try {
    const assessments = await Assessment.find({ isActive: true }).sort({ createdAt: -1 }).populate('trainer', 'name');

    const results = await Promise.all(assessments.map(async (a) => {
      const submission = await Submission.findOne({ assessment: a._id, student: req.user._id });
      return {
        ...a.toObject(),
        hasSubmitted: !!submission,
        mySubmission: submission
      };
    }));

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/assessments', auth, adminAuth, async (req, res) => {
  try {
    const assessment = new Assessment({ ...req.body, trainer: req.user._id });
    await assessment.save();
    res.status(201).json(assessment);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/assessments/submit', auth, async (req, res) => {
  const { assessmentId, answers } = req.body;
  try {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Not found' });

    let score = 0;
    assessment.questions.forEach((q, idx) => {
      const correctIdx = q.correctAnswer;
      if (answers[idx] === correctIdx) score++;
    });

    const submission = new Submission({
      assessment: assessmentId,
      student: req.user._id,
      answers,
      score,
      isGraded: true
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- ADMIN / TRAINER ROUTES ---

app.post('/api/admin/tests/create', auth, adminAuth, upload.single('pdfFile'), async (req, res) => {
  try {
    const { title, duration } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required.' });
    if (!req.file) return res.status(400).json({ error: 'PDF file is required.' });

    const pdfBuffer = req.file.buffer;

    // 1. Extract text from PDF using pdf-parse v2 API
    console.log(`📖 Parsing PDF: ${req.file.originalname} (${req.file.size} bytes)`);
    const parser = new PDFParse({
      data: new Uint8Array(pdfBuffer),
      verbosity: 0
    });
    const textResult = await parser.getText();
    const rawText = textResult.text;
    await parser.destroy();
    console.log(`📝 Extracted ${rawText.length} chars from PDF`);

    // 2. Extract questions from text
    const questions = extractQuestions(rawText);
    console.log(`✅ Found ${questions.length} questions in PDF`);

    if (questions.length === 0) {
      return res.status(400).json({
        error: 'Could not extract any questions from the PDF. Please ensure your PDF uses a supported MCQ format (e.g. "1. Question\\nA) Option\\nB) Option\\nAnswer: A").'
      });
    }

    // 3. Upload PDF to Firebase Storage
    if (!bucket) return res.status(500).json({ error: 'Firebase Storage not configured.' });

    const fileName = `assessments/${Date.now()}-${req.file.originalname}`;
    const fileRef = bucket.file(fileName);

    console.log(`📤 Uploading PDF to Firebase: ${fileName}`);
    await fileRef.save(pdfBuffer, { metadata: { contentType: 'application/pdf' } });
    await fileRef.makePublic();
    const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log(`✅ PDF uploaded: ${pdfUrl}`);

    // 4. Save assessment
    const assessment = new Assessment({
      title,
      duration: parseInt(duration) || 30,
      trainer: req.user._id,
      questions,
      pdfUrl
    });

    await assessment.save();
    res.status(201).json({
      ...assessment.toObject(),
      questionsExtracted: questions.length
    });
  } catch (err) {
    console.error('❌ Create Assessment Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/submissions', auth, adminAuth, async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('student', 'name email role')
      .populate('assessment')
      .sort({ createdAt: -1 });

    const detailed = submissions.map(sub => {
      if (!sub.assessment) return sub.toObject();
      const breakdown = sub.assessment.questions.map((q, idx) => ({
        question: q.text,
        studentOption: q.options[sub.answers[idx]],
        correctOption: q.options[q.correctAnswer],
        isCorrect: sub.answers[idx] === q.correctAnswer
      }));
      return { ...sub.toObject(), detailedAnswers: breakdown };
    });

    res.json(detailed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => console.log(`🚀 Flytutor Server running on port ${PORT}`));
