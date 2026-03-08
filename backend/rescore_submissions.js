
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assessment from './models/Assessment.js';
import Submission from './models/Submission.js';

dotenv.config();

async function reScoreSubmissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const assessments = await Assessment.find().sort({ createdAt: -1 }).limit(1);
        if (assessments.length === 0) {
            console.log("No assessments found.");
            process.exit(0);
        }

        const a = assessments[0];
        console.log(`Re-scoring submissions for: ${a.title} (${a._id})`);

        const submissions = await Submission.find({ assessment: a._id });
        console.log(`Found ${submissions.length} submissions to update.`);

        for (const sub of submissions) {
            let newScore = 0;
            a.questions.forEach((q, idx) => {
                const studentChoice = sub.answers[idx];
                const correctIdx = q.correctAnswer;
                if (studentChoice === correctIdx) {
                    newScore++;
                }
            });

            console.log(`Updating submission ${sub._id}: Score ${sub.score} -> ${newScore}`);
            sub.score = newScore;
            await sub.save();
        }

        console.log("✅ All submissions re-scored successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reScoreSubmissions();
