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

    // Create file URL
    const fileUrl = `/images/chat/${file.filename}`;

    // Save file information to database
    const chatFile = new ChatFile({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path, // Full file system path
      url: fileUrl,
      size: file.size,
      mimeType: file.mimetype,
      mediaType,
      uploadedBy: user._id,
    });

    await chatFile.save();

    console.log(
      `📁 File uploaded successfully: ${file.filename} by user ${user.id}`
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
    // Clean up file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Upload error:", error);
    return next(new AppError("Failed to upload file", 500));
  }
};
