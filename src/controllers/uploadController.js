const fs = require("fs");
const AppError = require("../errors/appError");
const ChatFile = require("../models/chatFile.model");

// Helper function to get media type from mime type
const getMediaType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
};

// Upload chat media files
exports.uploadChatMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    const { file, user } = req;
    const mediaType = getMediaType(file.mimetype);

    console.log("📁 File object:", JSON.stringify(file, null, 2)); // Debug log

    // For S3 uploads, use the generated filename or extract from key
    const filename =
      file.generatedFilename ||
      (file.key ? file.key.split("/").pop() : file.filename);
    const filePath = file.s3Key || file.key || file.path; // S3 key or local path

    // Use CloudFront URL if available, fallback to S3 location, then local path
    const fileUrl =
      req.file.cloudFrontUrl || req.file.location || `/images/chat/${filename}`;

    console.log("📁 Processed file data:", {
      filename,
      filePath,
      fileUrl,
      originalName: file.originalname,
      size: file.size,
    });

    // Save file information to database
    const chatFile = new ChatFile({
      filename: filename,
      originalName: file.originalname,
      path: filePath, // S3 key or full file system path
      url: fileUrl,
      size: file.size,
      mimeType: file.mimetype,
      mediaType,
      uploadedBy: user._id,
    });

    await chatFile.save();

    console.log(
      `📁 File uploaded successfully: ${filename} by user ${user._id}`
    );

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        file: {
          filename: chatFile.filename,
          originalName: chatFile.originalName,
          path: chatFile.path,
          url: chatFile.url,
          size: chatFile.size,
          mimeType: chatFile.mimeType,
          mediaType: chatFile.mediaType,
          uploadedAt: chatFile.uploadedAt,
          uploadedBy: chatFile.uploadedBy,
        },
      },
    });
  } catch (error) {
    // Clean up file if database save fails (only for local files)
    if (
      req.file &&
      req.file.path &&
      !req.file.key &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }
    // Note: For S3 files, we could implement S3 cleanup here if needed
    // For now, S3 files will remain if DB save fails (can be cleaned up later)

    console.error("Upload error:", error);
    console.error("Error Details:", {
      message: error.message,
      stack: error.stack,
      status: error.status || "failed",
      statusCode: error.statusCode || 500,
    });
    return next(new AppError("Failed to upload file", 500));
  }
};
