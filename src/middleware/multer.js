const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directories exist
const profileImageDir = path.join(__dirname, "../../images");
const postsDir = path.join(__dirname, "../../images/posts");

// Create directories if they don't exist
if (!fs.existsSync(profileImageDir)) {
  fs.mkdirSync(profileImageDir, { recursive: true });
}
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

// Configure storage based on file type
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use different directories for different types of uploads
    if (req.baseUrl === "/api/posts") {
      // For post uploads
      cb(null, postsDir);
    } else {
      // For profile images and other uploads
      cb(null, profileImageDir);
    }
  },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname);
    cb(
      null,
      file.fieldname +
        "-" +
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        ext
    );
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Unsupported file type. Only images and videos are allowed."),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // 30 MB in bytes
    fileSize: 30 * 1024 * 1024,
  },
});

module.exports = upload;
