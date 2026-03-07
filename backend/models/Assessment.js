import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [String],
    correctAnswer: { type: Number, required: true }, // Index of correct option
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    pdfUrl: { type: String }, // Link to PDF question paper
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    duration: { type: Number, default: 30 }, // Duration in minutes
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Assessment', assessmentSchema);
