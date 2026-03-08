
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Submission from './models/Submission.js';
import User from './models/User.js';

dotenv.config();

async function checkSubmissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const subs = await Submission.find().sort({ createdAt: -1 }).limit(1).populate('student', 'name email');
        if (subs.length === 0) {
            console.log("No submissions found.");
            process.exit(0);
        }

        const s = subs[0];
        console.log(`Submission by: ${s.student?.name} (${s.student?.email})`);
        console.log(`Score: ${s.score}`);
        console.log(`Answers RAW:`, s.answers);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSubmissions();
