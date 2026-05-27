#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const uri = process.env.MONGO_URI;

const maskUri = (u) => {
  if (!u) return '<none>';
  try {
    return u.replace(/\/\/.*@/, '//<credentials>@');
  } catch (e) {
    return '<masked>';
  }
};

console.log(`[Test] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
console.log('[Test] Using MONGO_URI:', maskUri(uri));

const opts = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

(async () => {
  try {
    const conn = await mongoose.connect(uri, opts);
    console.log('[Test] Connected to MongoDB host:', conn.connection.host);
    await mongoose.disconnect();
    console.log('[Test] Disconnected successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Test] Connection error:', err.message);
    if (err.reason) console.error('[Test] Reason:', err.reason);
    console.error('[Test] Full error:', err);
    process.exit(2);
  }
})();
