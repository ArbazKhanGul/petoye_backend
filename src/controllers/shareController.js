const Post = require('../models/post.model');
const PetListing = require('../models/petListing.model');
const User = require('../models/user.model');

/**
 * Generate HTML with Open Graph meta tags for post sharing
 * When shared on social media, shows rich preview with image, title, description
 */
exports.sharePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'fullName profileImage')
      .lean();

    if (!post) {
      return res.status(404).send(generateErrorHTML('Post not found'));
    }

    // Get first image from mediaFiles
    const firstMedia = post.mediaFiles && post.mediaFiles.length > 0 
      ? post.mediaFiles[0] 
      : null;
    
    const imageUrl = firstMedia && firstMedia.type === 'image'
      ? `${req.protocol}://${req.get('host')}${firstMedia.url}`
      : `${req.protocol}://${req.get('host')}/assets/petoye.png`; // Default app logo

    const description = post.content 
      ? post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')
      : 'Check out this post on Petoye!';

    const title = `${post.author?.fullName || 'Someone'} shared a post on Petoye`;

    const html = generatePostHTML(postId, title, description, imageUrl);
    
    res.send(html);
  } catch (error) {
    console.error('Error generating post share page:', error);
    res.status(500).send(generateErrorHTML('Failed to load post'));
  }
};

/**
 * Generate HTML with Open Graph meta tags for pet listing sharing
 */
exports.sharePetListing = async (req, res) => {
  try {
    const { petId } = req.params;

    const pet = await PetListing.findById(petId)
      .populate('owner', 'fullName profileImage')
      .lean();

    if (!pet) {
      return res.status(404).send(generateErrorHTML('Pet listing not found'));
    }

    // Get first image from mediaFiles
    const firstMedia = pet.mediaFiles && pet.mediaFiles.length > 0 
      ? pet.mediaFiles[0] 
      : null;
    
    const imageUrl = firstMedia 
      ? `${req.protocol}://${req.get('host')}${firstMedia.url}`
      : `${req.protocol}://${req.get('host')}/assets/petoye.png`;

    const description = `${pet.name} - ${pet.type || 'Pet'}, ${pet.gender || ''}, ${pet.currencySymbol || '$'}${pet.price}. ${pet.description || 'Available for adoption!'}`.substring(0, 150);

    const title = `${pet.name} is looking for a home! - Petoye`;

    const html = generatePetHTML(petId, title, description, imageUrl);
    
    res.send(html);
  } catch (error) {
    console.error('Error generating pet share page:', error);
    res.status(500).send(generateErrorHTML('Failed to load pet listing'));
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
      return res.status(404).send(generateErrorHTML('User not found'));
    }

    const imageUrl = user.profileImage 
      ? `${req.protocol}://${req.get('host')}${user.profileImage}`
      : `${req.protocol}://${req.get('host')}/assets/petoye.png`;

    const description = user.bio 
      ? user.bio.substring(0, 150)
      : `Check out ${user.fullName}'s profile on Petoye!`;

    const title = `${user.fullName} - Petoye`;

    const html = generateProfileHTML(userId, title, description, imageUrl);
    
    res.send(html);
  } catch (error) {
    console.error('Error generating profile share page:', error);
    res.status(500).send(generateErrorHTML('Failed to load profile'));
  }
};

/**
 * Generate HTML for post with Open Graph tags and deep link redirect
 */
function generatePostHTML(postId, title, description, imageUrl) {
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
  <meta property="twitter:url" content="${process.env.API_URL}/share/post/${postId}">
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: white;
    }
    .container {
      text-align: center;
      max-width: 500px;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
    }
    h1 { font-size: 24px; margin: 20px 0; }
    p { font-size: 16px; margin: 10px 0; opacity: 0.9; }
    .button {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 15px 30px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 20px;
      transition: transform 0.2s;
    }
    .button:hover { transform: scale(1.05); }
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
    <div class="logo">🐾</div>
    <h1>Opening in Petoye App...</h1>
    <p>${escapeHtml(description)}</p>
    <p>If the app doesn't open automatically:</p>
    <a href="petoye://post/${postId}" class="button">Open in App</a>
    <br><br>
    <a href="https://play.google.com/store/apps/details?id=com.petoye" class="button">Download Petoye</a>
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
    .replace(/post\//g, 'pet/')
    .replace(/petoye:\/\/post\//g, 'petoye://pet/');
}

/**
 * Generate HTML for user profile
 */
function generateProfileHTML(userId, title, description, imageUrl) {
  return generatePostHTML(userId, title, description, imageUrl)
    .replace(/post\//g, 'profile/')
    .replace(/petoye:\/\/post\//g, 'petoye://profile/');
}

/**
 * Generate error HTML page
 */
function generateErrorHTML(message) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Petoye</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: white;
      text-align: center;
    }
    .container { max-width: 500px; }
    h1 { font-size: 48px; margin: 0; }
    p { font-size: 18px; margin: 20px 0; }
    .button {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 15px 30px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>😕</h1>
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
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
