require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../src/admin/models/admin.model");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: "admin@petoye.com",
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("Email:", existingAdmin.email);
      console.log(
        "If you forgot the password, you can delete this admin and run the script again."
      );
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      fullName: "Petoye Admin",
      email: "admin@petoye.com",
      password: "Admin@123456", // Will be hashed automatically by the pre-save hook
      role: "super_admin",
      isActive: true,
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!");
    console.log("\n================================");
    console.log("Admin Login Credentials:");
    console.log("================================");
    console.log("Email:    admin@petoye.com");
    console.log("Password: Admin@123456");
    console.log("================================");
    console.log("\n⚠️  IMPORTANT: Please change this password after first login!");
    console.log("\nYou can login at: POST /api/admin/auth/login");
    console.log(
      "Change password at: PUT /api/admin/auth/change-password\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

seedAdmin();
