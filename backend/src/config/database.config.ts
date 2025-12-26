import mongoose from "mongoose";
import { Env } from "../config/env.config";
const connectDatabase = async () =>{
    try {
        await mongoose.connect(Env.MONGO_URI, {
        serverSelectionTimeoutMS:8000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        });
        console.log("✅ Connected to MongoDB"); 
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB", error);
        process.exit(1);
    }
};
export default connectDatabase;
export { mongoose };