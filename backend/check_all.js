
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assessment from './models/Assessment.js';

dotenv.config();

async function checkAssessments() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const assessments = await Assessment.find().sort({ createdAt: -1 });
        console.log(`Found ${assessments.length} assessments.`);

        for (const a of assessments) {
            console.log(`\n--- Assessment: ${a.title} (${a._id}) ---`);
            a.questions.slice(0, 5).forEach((q, i) => {
                console.log(`${i + 1}. Correct: Index ${q.correctAnswer} (${q.options[q.correctAnswer]})`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAssessments();
