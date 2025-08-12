/**
 * Generate a unique username from email or name
 * @param {string} email - User's email address
 * @param {string} name - User's full name (optional)
 * @returns {string} - Generated username
 */
const generateUsername = async (email, name = null) => {
  const { User } = require("../models");

  let baseUsername;

  if (name) {
    // Generate from name: remove spaces, convert to lowercase, remove special chars
    baseUsername = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 20);
  } else {
    // Generate from email: take part before @
    baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
  }

  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = baseUsername + Math.random().toString(36).substring(2, 5);
  }

  let username = baseUsername;
  let counter = 1;

  // Check if username exists and add numbers if needed
  while (await User.findOne({ username })) {
    username = baseUsername + counter;
    counter++;

    // Prevent infinite loop
    if (counter > 9999) {
      username = baseUsername + Date.now().toString().slice(-4);
      break;
    }
  }

  return username;
};

module.exports = {
  generateUsername,
};
