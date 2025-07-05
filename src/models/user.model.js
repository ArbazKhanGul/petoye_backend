const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: {
      type: String,
    },
    emailVerify: {
      type: Boolean,
      default: false,
    },
    fcmTokens: [
      {
        type: String,
        trim: true,
      },
    ],
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Generate Auth Token
userSchema.methods.generateAuthToken = async function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN,
    { expiresIn: "1d" }
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = async function () {
  const ms = require("../helpers/ms");
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.SECRET_KEY_JSON_WEB_TOKEN_REFRESH,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );
};

// Static method to verify refresh token
userSchema.statics.verifyRefreshToken = function (token) {
  try {
    return jwt.verify(token, process.env.SECRET_KEY_JSON_WEB_TOKEN_REFRESH);
  } catch (err) {
    return null;
  }
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
