import mongoose from "mongoose";
import env from "./env.js";

/**
 * MongoDB Connection with retry logic and production-ready options
 */
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async (retryCount = 5) => {
  const options = {
    autoIndex: env.nodeEnv === "development",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  for (let attempt = 0; attempt <= retryCount; attempt++) {
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

      return conn;
    } catch (error) {
      console.error(`[Database] Error: ${error.message}`);

      const attemptsLeft = retryCount - attempt;
      if (attemptsLeft > 0) {
        console.log(`[Database] Retrying connection in 5 seconds... (${attemptsLeft} attempts left)`);
        await wait(5000);
        continue;
      }

      console.error("[Database] Max retries reached. Throwing error.");
      throw error;
    }
  }
};

export default connectDB;