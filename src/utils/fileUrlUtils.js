// src/utils/fileUrlUtils.js

/**
 * Get the appropriate file URL based on configuration
 * Priority: CloudFront > S3 Direct > Local fallback
 */
const getFileUrl = (file, folder = "uploads") => {
  // If CloudFront URL was already constructed in multer, use it
  if (file.cloudFrontUrl) {
    return file.cloudFrontUrl;
  }

  // If S3 location is available, use it
  if (file.location) {
    return file.location;
  }

  // Fallback to local file path
  if (file.filename) {
    return `/images/${folder}/${file.filename}`;
  }

  if (file.path) {
    const path = require("path");
    return `/images/${folder}/${path.basename(file.path)}`;
  }

  return null;
};

/**
 * Construct CloudFront URL manually if needed
 */
const constructCloudFrontUrl = (s3Key) => {
  const cloudFrontUrl = process.env.CLOUDFRONT_DOMAIN_NAME;
  if (cloudFrontUrl) {
    return `https://${cloudFrontUrl}/${s3Key}`;
  }

  // Fallback to S3 direct URL if CloudFront not configured
  const region = process.env.AWS_REGION || "us-east-1";
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
};

module.exports = {
  getFileUrl,
  constructCloudFrontUrl,
};
