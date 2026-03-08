
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Submission from './models/Submission.js';

dotenv.config();

async function checkSubmissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const subs = await Submission.find().populate('student');
        console.log(`Found ${subs.length} submissions.`);

        for (const s of subs) {
            console.log(`\nSubmission ID: ${s._id}`);
            console.log(`Student: ${s.student ? s.student.name : 'NULL'} (${s.student ? s.student.email : 'NULL'})`);
            console.log(`Score: ${s.score}`);
            const answeredCount = s.answers.filter(a => a !== -1).length;
            console.log(`Answered Questions: ${answeredCount}`);
            if (answeredCount > 0) {
                console.log(`First 5 Answers:`, s.answers.slice(0, 5));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSubmissions();
