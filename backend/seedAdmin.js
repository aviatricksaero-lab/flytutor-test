import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Aviatricks-test-portal:Aviatricks123@aviatricks-test-portal.8jqoiem.mongodb.net/?appName=Aviatricks-test-portal";
        
        console.log('🔌 Connecting to MongoDB for seeding...');
        await mongoose.connect(MONGO_URI);
        
        const adminEmail = 'admin@flytutor.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            console.log('⚠️ Admin already exists. Updating password...');
            existingAdmin.password = 'Admin@123';
            await existingAdmin.save();
            console.log('✅ Admin password updated successfully!');
        } else {
            const adminUser = new User({
                name: 'System Admin',
                email: adminEmail,
                password: 'Admin@123',
                role: 'ADMIN',
                phone: '+910000000000'
            });
            await adminUser.save();
            console.log('✅ Admin user created successfully!');
        }
        
        console.log('\n--- Admin Login Details ---');
        console.log('Email:', adminEmail);
        console.log('Password: Admin@123');
        console.log('---------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
