const User = require("./user.model");
const Otp = require("./otp.model");
const SessionToken = require("./sessionToken.model");
const Referral = require("./referral.model");
const TokenTransaction = require("./tokenTransaction.model");
const PetListing = require("./petListing.model");
const Post = require("./post.model");
const Like = require("./like.model");
const Comment = require("./comment.model");
const RewardConfig = require("./rewardConfig.model");

module.exports = {
  User,
  Otp,
  SessionToken,
  Referral,
  TokenTransaction,
  PetListing,
  Post,
  Like,
  Comment,
  RewardConfig,
};
