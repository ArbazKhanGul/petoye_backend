const Post = require("../models/post.model");
const PetListing = require("../models/petListing.model");
const User = require("../models/user.model");
const CompetitionEntry = require("../models/competitionEntry.model");
const Competition = require("../models/competition.model");

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
 * Generate HTML with Open Graph meta tags for competition entry sharing
 */
exports.shareCompetitionEntry = async (req, res) => {
  try {
    const { competitionId, entryId } = req.params;

    const entry = await CompetitionEntry.findById(entryId)
      .populate("userId", "fullName profileImage")
      .lean();

    if (!entry) {
      return res
        .status(404)
        .send(generateErrorHTML("Competition entry not found"));
    }

    const competition = await Competition.findById(competitionId).lean();

    if (!competition) {
      return res.status(404).send(generateErrorHTML("Competition not found"));
    }

    // Get first image from entry
    const imageUrl = entry.imageUrl
      ? `${req.protocol}://${req.get("host")}${entry.imageUrl}`
      : `${req.protocol}://${req.get("host")}/assets/petoye.png`;

    const description = `Vote for ${entry.petName} in today's Daily Arena! Current votes: ${entry.voteCount}. Help them win! 🏆`;

    const title = `${entry.petName} - ${
      competition.title || "Daily Arena"
    } - Petoye`;

    const html = generateCompetitionEntryHTML(
      competitionId,
      entryId,
      title,
      description,
      imageUrl
    );

    res.send(html);
  } catch (error) {
    console.error("Error generating competition entry share page:", error);
    res.status(500).send(generateErrorHTML("Failed to load competition entry"));
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
 * Generate HTML with Open Graph meta tags for referral/invite sharing
 */
exports.shareReferral = async (req, res) => {
  try {
    const { referralCode } = req.params;

    // Find user with this referral code
    const user = await User.findOne({ referralCode }).lean();

    if (!user) {
      return res.status(404).send(generateErrorHTML("Invalid referral code"));
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/assets/petoye.png`;

    const description = `${user.fullName} invited you to join Petoye! Use referral code: ${referralCode}. Discover amazing pets, connect with pet lovers, and find your perfect companion! 🐾`;

    const title = `Join Petoye with ${user.fullName}'s referral code!`;

    const html = generateReferralHTML(
      referralCode,
      title,
      description,
      imageUrl,
      user.fullName
    );

    res.send(html);
  } catch (error) {
    console.error("Error generating referral share page:", error);
    res.status(500).send(generateErrorHTML("Failed to load referral"));
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
 * Generate HTML for competition entry
 */
function generateCompetitionEntryHTML(
  competitionId,
  entryId,
  title,
  description,
  imageUrl
) {
  const logoUrl = `${process.env.API_URL}/assets/petoye.png`;
  const appStoreUrl = "https://apps.apple.com/app/id123456789"; // Update with actual App Store URL
  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.petoye";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${
    process.env.API_URL
  }/share/competition/${competitionId}/${entryId}" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${imageUrl}" />
  
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
    }
    
    .container {
      max-width: 500px;
      background: #1a1a1a;
      border-radius: 24px;
      padding: 40px 30px;
      box-shadow: 0 10px 50px rgba(255, 226, 89, 0.2);
      text-align: center;
      animation: slideUp 0.6s ease-out;
    }
    
    .logo-container {
      margin-bottom: 30px;
    }
    
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(255, 226, 89, 0.3);
    }
    
    .preview-image {
      width: 100%;
      max-width: 400px;
      height: 300px;
      object-fit: cover;
      border-radius: 16px;
      margin: 20px auto;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    
    .trophy {
      font-size: 60px;
      margin: 20px 0;
      animation: bounce 1s infinite;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 20px 0 10px;
      color: #FFE259;
      line-height: 1.3;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      margin: 15px 0;
      opacity: 0.9;
      color: #e0e0e0;
    }
    
    .cta-text {
      font-size: 18px;
      font-weight: 600;
      margin: 30px 0 20px;
      color: #FFE259;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FFE259 0%, #ffd000 100%);
      color: #000000;
      padding: 18px 50px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      margin: 10px 0;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(255, 226, 89, 0.4);
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(255, 226, 89, 0.6);
    }
    
    .store-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 20px;
      align-items: center;
    }
    
    .store-button {
      display: inline-block;
      background: #2a2a2a;
      color: #ffffff;
      padding: 14px 30px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      border: 1px solid #3a3a3a;
      min-width: 200px;
    }
    
    .store-button:hover {
      background: #3a3a3a;
      transform: translateY(-2px);
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  </style>
  
  <script>
    // Attempt deep link first
    window.location.href = 'petoye://competition/${competitionId}/${entryId}';
    
    // If still on page after 2 seconds, show app store links
    setTimeout(function() {
      document.getElementById('appNotInstalled').style.display = 'block';
      document.getElementById('openingApp').style.display = 'none';
    }, 2000);
  </script>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${logoUrl}" alt="Petoye Logo" class="logo" />
    </div>
    
    <img src="${imageUrl}" alt="Competition Entry" class="preview-image" onerror="this.style.display='none'" />
    
    <div class="trophy">🏆</div>
    
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    
    <div id="openingApp">
      <p class="cta-text">Opening Petoye...</p>
    </div>
    
    <div id="appNotInstalled" style="display: none;">
      <p class="cta-text">Don't have the app? Download Petoye now!</p>
      <div class="store-links">
        <a href="${playStoreUrl}" class="store-button">📱 Get on Google Play</a>
        <a href="${appStoreUrl}" class="store-button">🍎 Get on App Store</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
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

/**
 * Generate HTML for referral invite
 */
function generateReferralHTML(
  referralCode,
  title,
  description,
  imageUrl,
  userName
) {
  const logoUrl = `${process.env.API_URL}/assets/petoye.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${
    process.env.API_URL
  }/share/referral/${referralCode}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${
    process.env.API_URL
  }/share/referral/${referralCode}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${imageUrl}">
  
  <!-- Deep Link -->
  <meta property="al:android:url" content="petoye://referral/${referralCode}">
  <meta property="al:android:package" content="com.petoye">
  <meta property="al:android:app_name" content="Petoye">
  <meta property="al:ios:url" content="petoye://referral/${referralCode}">
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
    
    .gift-icon {
      font-size: 60px;
      margin: 20px 0;
      animation: bounce 1s ease-in-out infinite;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 20px 0;
      color: #FFE259;
      animation: slideUp 0.6s ease-out;
    }
    
    .referral-code {
      font-size: 32px;
      font-weight: 800;
      color: #FFE259;
      background: rgba(255, 226, 89, 0.1);
      padding: 15px 30px;
      border-radius: 15px;
      margin: 20px 0;
      letter-spacing: 3px;
      border: 2px solid #FFE259;
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
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 20px 10px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      .referral-code {
        font-size: 24px;
        padding: 12px 20px;
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
      const deepLink = 'petoye://referral/${referralCode}';
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
    
    <div class="gift-icon">🎁</div>
    
    <h1>You're invited to join Petoye!</h1>
    
    <p class="description">${escapeHtml(
      userName
    )} wants you to join the pet lover community!</p>
    
    <div class="referral-code">${escapeHtml(referralCode)}</div>
    
    <p class="description">Use this code to get rewards when you sign up! 🐾</p>
    
    <div class="spinner"></div>
    
    <p class="info-text">Opening Petoye App...</p>
    
    <div class="buttons-container">
      <a href="petoye://referral/${referralCode}" class="button">Open in App</a>
      <a href="https://play.google.com/store/apps/details?id=com.petoye" class="button button-secondary">Download Petoye</a>
    </div>
  </div>
</body>
</html>
  `;
}
