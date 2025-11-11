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
      enum: ["super_admin", "admin", "moderator", "viewer"],
      default: "admin",
    },
    permissions: {
      users: {
        view: { type: Boolean, default: true },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      posts: {
        view: { type: Boolean, default: true },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      pets: {
        view: { type: Boolean, default: true },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      admins: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profileImage: {
      type: String,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    // Session management
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set default permissions based on role
adminSchema.methods.setDefaultPermissions = function () {
  switch (this.role) {
    case "super_admin":
      this.permissions = {
        users: { view: true, create: true, edit: true, delete: true },
        posts: { view: true, create: true, edit: true, delete: true },
        pets: { view: true, create: true, edit: true, delete: true },
        admins: { view: true, create: true, edit: true, delete: true },
      };
      break;
    case "admin":
      this.permissions = {
        users: { view: true, create: false, edit: true, delete: false },
        posts: { view: true, create: false, edit: true, delete: true },
        pets: { view: true, create: false, edit: true, delete: true },
        admins: { view: false, create: false, edit: false, delete: false },
      };
      break;
    case "moderator":
      this.permissions = {
        users: { view: true, create: false, edit: false, delete: false },
        posts: { view: true, create: false, edit: true, delete: false },
        pets: { view: true, create: false, edit: true, delete: false },
        admins: { view: false, create: false, edit: false, delete: false },
      };
      break;
    case "viewer":
      this.permissions = {
        users: { view: true, create: false, edit: false, delete: false },
        posts: { view: true, create: false, edit: false, delete: false },
        pets: { view: true, create: false, edit: false, delete: false },
        admins: { view: false, create: false, edit: false, delete: false },
      };
      break;
  }
};

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate access token
adminSchema.methods.generateAuthToken = function () {
  const payload = {
    _id: this._id,
    email: this.email,
    role: this.role,
    type: "admin",
  };
  return jwt.sign(payload, process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN, {
    expiresIn: "24h",
  });
};

// Method to generate refresh token
adminSchema.methods.generateRefreshToken = function () {
  const payload = {
    _id: this._id,
    type: "admin",
  };
  return jwt.sign(payload, process.env.SECRET_KEY_JSON_WEB_TOKEN_REFRESH, {
    expiresIn: "7d",
  });
};

// Remove password from JSON response
adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.refreshTokens;
  return admin;
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
