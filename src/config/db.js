import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
  const conn = await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;