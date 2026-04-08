import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Admin from "../models/Admin.js";
import { ADMIN_ROLE } from "../constants/enums.js";

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const email = "superadmin@vidyamarg.com";
    const password = "Ankit@9771";

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`Admin with email ${email} already exists:`);
      console.log(`  Role: ${existing.role}`);
      console.log("Skipping seed.");
      process.exit(0);
    }

    const superAdmin = await Admin.create({
      name: "Super Admin",
      email,
      phone: "9771122334", // Using a placeholder or keeping what's there
      password,
      role: ADMIN_ROLE.SUPERADMIN,
    });

    console.log("SuperAdmin created successfully:");
    console.log(`  Name: ${superAdmin.name}`);
    console.log(`  Email: ${superAdmin.email}`);
    console.log(`  Password: ${password}`);
    console.log("IMPORTANT: Keep these credentials secure!");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedSuperAdmin();