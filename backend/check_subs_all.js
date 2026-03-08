
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Submission from './models/Submission.js';

dotenv.config();

async function checkSubmissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const subs = await Submission.find().populate('student', 'name email');
        console.log(`Found ${subs.length} submissions.`);

        for (const s of subs) {
            console.log(`\nSubmission by: ${s.student?.name} (${s.student?.email})`);
            console.log(`Score: ${s.score}`);
            console.log(`Answers RAW:`, s.answers.slice(0, 5), "...");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSubmissions();
