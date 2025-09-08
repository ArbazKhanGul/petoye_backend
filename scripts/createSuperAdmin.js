require("dotenv").config();
require("../src/config/db");
const Admin = require("../src/models/admin.model");
const bcrypt = require("bcrypt");

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ role: "super_admin" });
    if (existingAdmin) {
      console.log("Super admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      fullName: "Super Administrator",
      username: "superadmin",
      email: "admin@petoye.com",
      password: "Admin@123456", // This will be hashed by the model
      role: "super_admin",
      permissions: [
        "user_management",
        "post_management",
        "token_management",
        "analytics_view",
        "admin_management",
        "system_settings"
      ],
      isActive: true,
    });

    await superAdmin.save();
    console.log("Super admin created successfully!");
    console.log("Email:", superAdmin.email);
    console.log("Password: Admin@123456");
    console.log("Please change the password after first login.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
}

createSuperAdmin();
