const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const adminSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "moderator"],
      default: "admin",
    },
    profileImage: {
      type: String,
    },
    permissions: [{
      type: String,
      enum: [
        "user_management",
        "post_management", 
        "token_management",
        "analytics_view",
        "admin_management",
        "system_settings"
      ]
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Generate Auth Token
adminSchema.methods.generateAuthToken = async function () {
  return jwt.sign(
    { _id: this._id, role: this.role, type: "admin" },
    process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN,
    { expiresIn: "8h" } // Shorter session for admin
  );
};

// Generate Refresh Token
adminSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    { _id: this._id, role: this.role, type: "admin" },
    process.env.SECRET_KEY_JSON_WEB_TOKEN_REFRESH,
    { expiresIn: "7d" }
  );
};

// Static method to verify refresh token
adminSchema.statics.verifyRefreshToken = function (token) {
  try {
    return jwt.verify(token, process.env.SECRET_KEY_JSON_WEB_TOKEN_REFRESH);
  } catch (err) {
    return null;
  }
};

// Hash password before saving
adminSchema.pre("save", async function (next) {
  const admin = this;
  if (admin.isModified("password")) {
    const salt = await bcrypt.genSalt(12); // Higher salt rounds for admin
    admin.password = await bcrypt.hash(admin.password, salt);
  }
  next();
});

// Method to check password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
