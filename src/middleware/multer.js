const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directories exist
const profileImageDir = path.join(__dirname, "../../images/profile");
const postsDir = path.join(__dirname, "../../images/posts");
const petListingDir = path.join(__dirname, "../../images/petlisting");
const chatDir = path.join(__dirname, "../../images/chat");

// Create directories if they don't exist
if (!fs.existsSync(profileImageDir)) {
  fs.mkdirSync(profileImageDir, { recursive: true });
}
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}
if (!fs.existsSync(petListingDir)) {
  fs.mkdirSync(petListingDir, { recursive: true });
}
if (!fs.existsSync(chatDir)) {
  fs.mkdirSync(chatDir, { recursive: true });
}

// Configure storage based on file type
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use different directories for different types of uploads
    if (req.baseUrl === "/api/posts") {
      cb(null, postsDir);
    } else if (req.baseUrl === "/api/pets") {
      cb(null, petListingDir);
    } else if (req.baseUrl === "/api/chat") {
      cb(null, chatDir);
    } else if (req.baseUrl === "/api/profile" || req.baseUrl === "/api/auth") {
      // Profile images go to profile directory
      cb(null, profileImageDir);
    } else {
      cb(null, profileImageDir); // Default to profile directory
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
  // Accept images, videos, and common documents
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");
  const isDoc =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "text/plain";
  if (isImage || isVideo || isDoc) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type. Only images, videos, and documents are allowed."
      ),
      false
    );
  }
};

// Configure multer
const maxMb = parseInt(
  process.env.CHAT_MAX_MEDIA_SIZE_MB ||
    process.env.MAX_MEDIA_FILE_SIZE_MB ||
    "5",
  10
);
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // In bytes; default 5MB
    fileSize: maxMb * 1024 * 1024,
  },
});

module.exports = upload;
