
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assessment from './models/Assessment.js';

dotenv.config();

async function checkAssessments() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const assessments = await Assessment.find().sort({ createdAt: -1 }).limit(1);
        if (assessments.length === 0) {
            console.log("No assessments found.");
            process.exit(0);
        }

        const a = assessments[0];
        console.log(`Assessment: ${a.title}`);
        a.questions.forEach((q, i) => {
            console.log(`${i + 1}. ${q.text}`);
            console.log(`   Options: ${q.options.join(' | ')}`);
            console.log(`   Correct Index: ${q.correctAnswer} (${q.options[q.correctAnswer]})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAssessments();
