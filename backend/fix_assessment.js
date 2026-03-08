
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assessment from './models/Assessment.js';

dotenv.config();

const correctAnswers = {
    1: 1, // B
    2: 1, // B
    3: 1, // B
    4: 2, // C
    5: 1, // B
    6: 2, // C
    7: 2, // C
    8: 1, // B
    9: 2, // C
    10: 2, // C
    11: 3, // D
    12: 2, // C
    13: 1, // B
    14: 0, // A
    15: 1, // B
    16: 1, // B
    17: 0, // A
    18: 1, // B
    19: 2, // C
    20: 2, // C
    21: 1, // B
    22: 1, // B
    23: 1, // B
    24: 3, // D
    25: 1, // B
    26: 1, // B
    27: 1, // B
    28: 2, // C
    29: 2, // C
    30: 2, // C
};

async function fixAssessment() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const assessments = await Assessment.find().sort({ createdAt: -1 }).limit(1);
        if (assessments.length === 0) {
            console.log("No assessments found.");
            process.exit(0);
        }

        const a = assessments[0];
        console.log(`Fixing Assessment: ${a.title} (${a._id})`);

        a.questions.forEach((q, i) => {
            const correctIdx = correctAnswers[i + 1];
            if (correctIdx !== undefined) {
                console.log(`Updating Q${i + 1}: ${q.correctAnswer} -> ${correctIdx}`);
                q.correctAnswer = correctIdx;
            }
        });

        await a.save();
        console.log("✅ Assessment updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixAssessment();
