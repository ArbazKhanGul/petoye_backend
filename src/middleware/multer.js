const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to construct CloudFront URL
const getCloudFrontUrl = (key) => {
  const cloudFrontUrl = process.env.CLOUDFRONT_DOMAIN_NAME;
  if (cloudFrontUrl) {
    return `https://${cloudFrontUrl}/${key}`;
  }
  // Fallback to S3 direct URL if CloudFront not configured
  const region = process.env.AWS_REGION || "us-east-1";
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

// S3 Storage Configuration
const storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  // ACL will be set only if bucket allows it
  ...(process.env.AWS_S3_ENABLE_ACL === "true" && { acl: "public-read" }),
  key: function (req, file, cb) {
    // Generate folder structure based on route
    let folder = "uploads"; // Default folder

    if (req.baseUrl === "/api/posts") {
      folder = "posts";
    } else if (req.baseUrl === "/api/pets") {
      folder = "petlisting";
    } else if (req.baseUrl === "/api/upload") {
      folder = "chat";
    } else if (req.baseUrl === "/api/profile" || req.baseUrl === "/api/auth") {
      folder = "profile";
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;

    const s3Key = `${folder}/${filename}`;
    console.log(`🚀 Uploading to S3: ${s3Key}`);

    // Store the CloudFront URL in the file object for later use
    file.cloudFrontUrl = getCloudFrontUrl(s3Key);

    cb(null, s3Key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set content type
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadDate: new Date().toISOString(),
    });
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
