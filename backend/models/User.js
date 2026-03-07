import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['STUDENT', 'TRAINER', 'ADMIN'], default: 'STUDENT' },
    fcmToken: { type: String },
}, { timestamps: true });

// Pre-save password hash
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidate) {
    return await bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
