import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const ConnectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI,);
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};