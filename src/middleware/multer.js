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
    console.log("🚀 ~ req.baseUrl:", req.baseUrl);
    if (req.baseUrl === "/api/posts") {
      cb(null, postsDir);
    } else if (req.baseUrl === "/api/pets") {
      cb(null, petListingDir);
    } else if (req.baseUrl === "/api/upload") {
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
  // Accept images, videos, and common document types
  const allowedMimeTypes = [
    // Images
    /^image\//,
    // Videos
    /^video\//,
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/octet-stream",
  ];

  const isAllowed = allowedMimeTypes.some((type) =>
    type instanceof RegExp ? type.test(file.mimetype) : file.mimetype === type
  );

  if (isAllowed) {
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
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // 30 MB in bytes
    fileSize: 30 * 1024 * 1024,
  },
});

module.exports = upload;
