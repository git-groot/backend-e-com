import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import User from "../models/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Explicitly point to root .env
dotenv.config({ path: join(__dirname, '../../.env') });

const seedSuperAdmin = async () => {
    try {
        console.log("🔍 MONGO_URI:", process.env.MONGO_URI) // debug

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");

        const existing = await User.findOne({ role: 'SuperAdmin' });
        if (existing) {
            console.log("⚠️  SuperAdmin already exists:", existing.email);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash("SuperAdmin@123", 10);

        const superAdmin = await User.create({
            name: "Super Admin",
            email: "superadmin@gmail.com",
            password: hashedPassword,
            role: "SuperAdmin",
        });

        console.log("✅ SuperAdmin created successfully!");
        console.log("📧 Email   :", superAdmin.email);
        console.log("🔑 Password: SuperAdmin@123");

    } catch (error) {
        console.error("❌ Seed failed:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
        process.exit(0);
    }
}

seedSuperAdmin();