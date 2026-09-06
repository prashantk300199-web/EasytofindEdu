import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/easytofindedu";

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  isActive: Boolean,
}, { timestamps: true });

const Admin = mongoose.model("Admin", adminSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@easytofindedu.com" });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email:", existingAdmin.email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("Admin@2024!Secure", 12);

    // Create admin user
    const admin = await Admin.create({
      name: "Admin",
      email: "admin@easytofindedu.com",
      phone: "+91-1234567890",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@easytofindedu.com");
    console.log("Password: Admin@2024!Secure");
    console.log("\nYou can now login to the admin dashboard!");

  } catch (error) {
    console.error("Error creating admin:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
