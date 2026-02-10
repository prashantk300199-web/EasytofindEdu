import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Admin from "../models/Admin.js";
import { ADMIN_ROLE } from "../constants/enums.js";

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await Admin.findOne({ role: ADMIN_ROLE.SUPERADMIN });
    if (existing) {
      console.log("SuperAdmin already exists:");
      console.log(`  Email: ${existing.email}`);
      console.log("Skipping seed.");
      process.exit(0);
    }

    const superAdmin = await Admin.create({
      name: "Super Admin",
      email: "superadmin@vidyamarg.com",
      phone: "9999999999",
      password: "SuperAdmin@123",
      role: ADMIN_ROLE.SUPERADMIN,
    });

    console.log("SuperAdmin created successfully:");
    console.log(`  Name: ${superAdmin.name}`);
    console.log(`  Email: ${superAdmin.email}`);
    console.log(`  Password: SuperAdmin@123`);
    console.log("IMPORTANT: Change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedSuperAdmin();