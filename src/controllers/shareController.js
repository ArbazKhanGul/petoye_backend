const Post = require("../models/post.model");
const PetListing = require("../models/petListing.model");
const User = require("../models/user.model");

/**
 * Generate HTML with Open Graph meta tags for post sharing
 * When shared on social media, shows rich preview with image, title, description
 */
exports.sharePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("userId", "fullName profileImage")
      .lean();

    if (!post) {
      return res.status(404).send(generateErrorHTML("Post not found"));
    }

    // Get first image from mediaFiles
    const firstMedia =
      post.mediaFiles && post.mediaFiles.length > 0 ? post.mediaFiles[0] : null;

    const imageUrl =
      firstMedia && firstMedia.type === "image"
        ? `${req.protocol}://${req.get("host")}${firstMedia.url}`
        : `${req.protocol}://${req.get("host")}/assets/petoye.png`; // Default app logo

    const description = post.content
      ? post.content.substring(0, 150) +
        (post.content.length > 150 ? "..." : "")
      : "Check out this post on Petoye!";

    const title = `${
      post.userId?.fullName || "Someone"
    } shared a post on Petoye`;

    const html = generatePostHTML(postId, title, description, imageUrl);

    res.send(html);
  } catch (error) {
    console.error("Error generating post share page:", error);
    res.status(500).send(generateErrorHTML("Failed to load post"));
  }
};

/**
 * Generate HTML with Open Graph meta tags for pet listing sharing
 */
exports.sharePetListing = async (req, res) => {
  try {
    const { petId } = req.params;

    const pet = await PetListing.findById(petId)
      .populate("owner", "fullName profileImage")
      .lean();

    if (!pet) {
      return res.status(404).send(generateErrorHTML("Pet listing not found"));
    }

    // Get first image from mediaFiles
    const firstMedia =
      pet.mediaFiles && pet.mediaFiles.length > 0 ? pet.mediaFiles[0] : null;

    const imageUrl = firstMedia
      ? `${req.protocol}://${req.get("host")}${firstMedia.url}`
      : `${req.protocol}://${req.get("host")}/assets/petoye.png`;

    const description = `${pet.name} - ${pet.type || "Pet"}, ${
      pet.gender || ""
    }, ${pet.currencySymbol || "$"}${pet.price}. ${
      pet.description || "Available for adoption!"
    }`.substring(0, 150);

    const title = `${pet.name} is looking for a home! - Petoye`;

    const html = generatePetHTML(petId, title, description, imageUrl);

    res.send(html);
  } catch (error) {
    console.error("Error generating pet share page:", error);
    res.status(500).send(generateErrorHTML("Failed to load pet listing"));
  }
};

/**
 * Generate HTML with Open Graph meta tags for user profile sharing
 */
exports.shareUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).send(generateErrorHTML("User not found"));
    }

    const imageUrl = user.profileImage
      ? `${req.protocol}://${req.get("host")}${user.profileImage}`
      : `${req.protocol}://${req.get("host")}/assets/petoye.png`;

    const description = user.bio
      ? user.bio.substring(0, 150)
      : `Check out ${user.fullName}'s profile on Petoye!`;

    const title = `${user.fullName} - Petoye`;

    const html = generateProfileHTML(userId, title, description, imageUrl);

    res.send(html);
  } catch (error) {
    console.error("Error generating profile share page:", error);
    res.status(500).send(generateErrorHTML("Failed to load profile"));
  }
};

/**
 * Generate HTML for post with Open Graph tags and deep link redirect
 */
function generatePostHTML(postId, title, description, imageUrl) {
  const logoUrl = `${process.env.API_URL}/assets/petoye.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${process.env.API_URL}/share/post/${postId}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${
    process.env.API_URL
  }/share/post/${postId}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${imageUrl}">
  
  <!-- Deep Link -->
  <meta property="al:android:url" content="petoye://post/${postId}">
  <meta property="al:android:package" content="com.petoye">
  <meta property="al:android:app_name" content="Petoye">
  <meta property="al:ios:url" content="petoye://post/${postId}">
  <meta property="al:ios:app_store_id" content="YOUR_APP_STORE_ID">
  <meta property="al:ios:app_name" content="Petoye">
  
  <title>${escapeHtml(title)}</title>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
      background: #000000;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #ffffff;
    }
    
    .container {
      text-align: center;
      max-width: 500px;
      padding: 40px 20px;
    }
    
    .logo-container {
      margin-bottom: 30px;
      animation: fadeIn 0.8s ease-in;
    }
    
    .logo {
      width: 120px;
      height: 120px;
      margin: 0 auto;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(255, 226, 89, 0.3);
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 20px 0;
      color: #FFE259;
      animation: slideUp 0.6s ease-out;
    }
    
    .description {
      font-size: 16px;
      line-height: 1.6;
      margin: 20px 0;
      opacity: 0.9;
      color: #ffffff;
      animation: slideUp 0.8s ease-out;
    }
    
    .info-text {
      font-size: 14px;
      margin: 30px 0 20px;
      opacity: 0.7;
      color: #ffffff;
    }
    
    .button {
      display: inline-block;
      background: #FFE259;
      color: #000000;
      padding: 16px 40px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      margin: 10px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 226, 89, 0.4);
      animation: slideUp 1s ease-out;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 226, 89, 0.6);
      background: #ffd000;
    }
    
    .button:active {
      transform: translateY(0);
    }
    
    .button-secondary {
      background: transparent;
      color: #FFE259;
      border: 2px solid #FFE259;
      box-shadow: none;
    }
    
    .button-secondary:hover {
      background: rgba(255, 226, 89, 0.1);
      box-shadow: 0 4px 15px rgba(255, 226, 89, 0.3);
    }
    
    .buttons-container {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      margin: 20px auto;
      border: 4px solid rgba(255, 226, 89, 0.3);
      border-top: 4px solid #FFE259;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 20px 10px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      .button {
        padding: 14px 30px;
        font-size: 14px;
        width: 100%;
        max-width: 280px;
      }
    }
  </style>
  
  <script>
    // Attempt to open app via deep link
    window.onload = function() {
      const deepLink = 'petoye://post/${postId}';
      const appStoreLink = 'https://play.google.com/store/apps/details?id=com.petoye';
      const timeout = setTimeout(function() {
        // If app didn't open, redirect to store
        window.location = appStoreLink;
      }, 2000);
      
      window.location = deepLink;
      
      // If user comes back, clear timeout
      window.addEventListener('blur', function() {
        clearTimeout(timeout);
      });
    };
  </script>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${logoUrl}" alt="Petoye Logo" class="logo" />
    </div>
    
    <div class="spinner"></div>
    
    <h1>Opening in Petoye App...</h1>
    
    <p class="description">${escapeHtml(description)}</p>
    
    <p class="info-text">If the app doesn't open automatically:</p>
    
    <div class="buttons-container">
      <a href="petoye://post/${postId}" class="button">Open in App</a>
      <a href="https://play.google.com/store/apps/details?id=com.petoye" class="button button-secondary">Download Petoye</a>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for pet listing
 */
function generatePetHTML(petId, title, description, imageUrl) {
  return generatePostHTML(petId, title, description, imageUrl)
    .replace(/post\//g, "pet/")
    .replace(/petoye:\/\/post\//g, "petoye://pet/");
}

/**
 * Generate HTML for user profile
 */
function generateProfileHTML(userId, title, description, imageUrl) {
  return generatePostHTML(userId, title, description, imageUrl)
    .replace(/post\//g, "profile/")
    .replace(/petoye:\/\/post\//g, "petoye://profile/");
}

/**
 * Generate error HTML page
 */
function generateErrorHTML(message) {
  const logoUrl = `${process.env.API_URL}/assets/petoye.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Petoye</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #000000;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #ffffff;
      text-align: center;
    }
    
    .container {
      max-width: 500px;
      padding: 40px 20px;
    }
    
    .logo-container {
      margin-bottom: 30px;
      animation: fadeIn 0.8s ease-in;
    }
    
    .logo {
      width: 120px;
      height: 120px;
      margin: 0 auto;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(255, 226, 89, 0.3);
    }
    
    .error-icon {
      font-size: 80px;
      margin: 20px 0;
      animation: shake 0.5s ease-in-out;
    }
    
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 20px 0;
      color: #FFE259;
    }
    
    p {
      font-size: 18px;
      line-height: 1.6;
      margin: 20px 0;
      opacity: 0.9;
    }
    
    .button {
      display: inline-block;
      background: #FFE259;
      color: #000000;
      padding: 16px 40px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      margin-top: 30px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 226, 89, 0.4);
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 226, 89, 0.6);
      background: #ffd000;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${logoUrl}" alt="Petoye Logo" class="logo" />
    </div>
    <div class="error-icon">😕</div>
    <h1>Oops! Something went wrong</h1>
    <p>${escapeHtml(message)}</p>
    <a href="https://play.google.com/store/apps/details?id=com.petoye" class="button">Go to Petoye</a>
  </div>
</body>
</html>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
