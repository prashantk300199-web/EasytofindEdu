import mongoose from "mongoose";
import env from "./env.js";

/**
 * MongoDB Connection with retry logic and production-ready options
 */
const connectDB = async (retryCount = 5) => {
  const options = {
    autoIndex: env.nodeEnv === "development",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(env.mongoUri, options);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error(`[Database] Mongoose connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[Database] Mongoose disconnected. Attempting to reconnect...");
    });

  } catch (error) {
    console.error(`[Database] Error: ${error.message}`);
    
    if (retryCount > 0) {
      console.log(`[Database] Retrying connection in 5 seconds... (${retryCount} attempts left)`);
      setTimeout(() => connectDB(retryCount - 1), 5000);
    } else {
      console.error("[Database] Max retries reached. Exiting...");
      process.exit(1);
    }
  }
};

export default connectDB;