import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [Number], // Index of selected options
    score: { type: Number, default: 0 },
    isGraded: { type: Boolean, default: false },
    projects: [{
        title: { type: String },
        description: { type: String }
    }],
    resumeUrl: { type: String }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
