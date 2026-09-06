import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function checkAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const Admin = mongoose.model("Admin", new mongoose.Schema({}, { strict: false }));

    const admin = await Admin.findOne({ email: "admin@easytofindedu.com" });

    if (admin) {
      console.log("✅ Admin user found!");
      console.log("Name:", admin.name);
      console.log("Email:", admin.email);
      console.log("Role:", admin.role);
      console.log("IsActive:", admin.isActive);
      console.log("Created:", admin.createdAt);
    } else {
      console.log("❌ Admin user NOT found!");
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAdmin();
