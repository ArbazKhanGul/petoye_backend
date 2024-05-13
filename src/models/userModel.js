const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  username: {
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
  phoneNumber: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profileImage: String,
  phoneVerify:{
  type:Boolean,
   default:false
  },
  emailVerify:{
    type:Boolean,
    default:false
  },
  fcmTokens: [{
    type: String,
    trim: true,
  }],
  otp: {
    value: {
      type: String,
      trim: true,
    },
    expiration: {
      type: Date,
    },
    status:{
      type:Boolean,
      default:false
    }
  }
});

userSchema.methods.generateAuthToken = async function () {
  return token = jwt.sign({ _id: this._id,role:this.role}, process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN);
};


userSchema.pre('save', async function (next) {
  const user = this;
  // Only hash the password if it has been modified (or is new)
  if (user.isModified('password')) {
    const salt = await bcrypt.genSalt(10); // Generate salt
    user.password = await bcrypt.hash(user.password, salt); // Hash the password
  }
  next(); // Proceed to save the document
});

const User = mongoose.model('User', userSchema);

module.exports = User;
