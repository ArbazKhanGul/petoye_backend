# Upload Middleware Documentation

## Overview

The upload middleware provides a comprehensive file upload solution for chat media files with validation, security, and organization features.

## Features

### ✅ **File Type Support**

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Videos**: MP4, MPEG, QuickTime, WebM, AVI, WMV
- **Audio**: MP3, WAV, OGG, M4A, WebM
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
- **Archives**: ZIP, RAR, 7Z

### 🔒 **Security & Validation**

- File size limit: 50MB maximum
- MIME type validation
- Unique filename generation
- Directory traversal protection
- Error handling for malformed uploads

### 📁 **File Organization**

- All files stored in `/images/chat/` directory
- Automatic directory creation
- Unique filename format: `file-{timestamp}-{random}.ext`

## Usage

### Basic Implementation

```javascript
// Import the middleware
const {
  uploadChatMedia,
  logUploadDetails,
} = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

// Use in routes
router.post(
  "/chat-media",
  protect, // Authentication
  uploadChatMedia, // File upload handling
  logUploadDetails, // Upload logging (optional)
  uploadController // Your controller function
);
```

### Controller Implementation

```javascript
// Your upload controller
const uploadController = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    const { file, user } = req;

    // File is available as req.file with properties:
    // - originalname: Original filename
    // - filename: Generated unique filename
    // - mimetype: MIME type
    // - size: File size in bytes
    // - path: Full file path
    // - destination: Upload directory

    console.log("File uploaded:", {
      original: file.originalname,
      stored: file.filename,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      type: file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/chat/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};
```

## Middleware Components

### 1. **uploadChatMedia** (Main Middleware)

Combined middleware that handles the complete upload process:

- File storage with unique naming
- Type validation
- Size validation
- Error handling

```javascript
const { uploadChatMedia } = require("../middleware/uploadMiddleware");
router.post("/upload", protect, uploadChatMedia, controller);
```

### 2. **logUploadDetails** (Optional)

Logs upload details for debugging and monitoring:

```javascript
const { logUploadDetails } = require("../middleware/uploadMiddleware");
router.post("/upload", protect, uploadChatMedia, logUploadDetails, controller);
```

### 3. **Individual Components** (Advanced)

For custom implementations:

```javascript
const {
  chatUpload, // Core multer instance
  handleUploadError, // Error handling
  validateFileSize, // Size validation
  chatFileFilter, // Type validation
} = require("../middleware/uploadMiddleware");

// Custom middleware chain
router.post(
  "/upload",
  protect,
  [
    chatUpload.single("file"),
    handleUploadError,
    validateFileSize(),
    logUploadDetails,
  ],
  controller
);
```

## Error Handling

The middleware provides comprehensive error handling:

### File Size Errors

```json
{
  "error": "File too large. Maximum size is 50MB. Your file is 75.2MB.",
  "statusCode": 413
}
```

### File Type Errors

```json
{
  "error": "Unsupported file type: application/exe. Please upload images, videos, audio, or documents.",
  "statusCode": 400
}
```

### Upload Errors

```json
{
  "error": "Too many files. Only one file allowed.",
  "statusCode": 400
}
```

## File Structure

```
petoye_backend/
├── src/
│   ├── middleware/
│   │   └── uploadMiddleware.js    # Main upload middleware
│   ├── controllers/
│   │   └── uploadController.js    # Upload logic
│   └── routes/
│       └── uploadRoutes.js        # Upload endpoints
└── images/
    └── chat/                      # Upload directory
        ├── file-1753703449440-935299430.jpg
        ├── file-1753703449452-974991299.mp4
        └── ...
```

## Frontend Integration

### HTML Form

```html
<form enctype="multipart/form-data">
  <input
    type="file"
    name="file"
    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
  />
  <button type="submit">Upload</button>
</form>
```

### JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("/api/upload/chat-media", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type, let browser set it with boundary
  },
  body: formData,
});

const result = await response.json();
```

### React Native

```javascript
const formData = new FormData();
formData.append("file", {
  uri: fileUri,
  type: mimeType,
  name: filename,
});

const response = await fetch("/api/upload/chat-media", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  },
  body: formData,
});
```

## Configuration

### Environment Variables

```env
# Optional: Customize upload directory
UPLOAD_DIR=/custom/upload/path

# Optional: Customize max file size (in bytes)
MAX_FILE_SIZE=52428800  # 50MB
```

### Customizing File Types

Edit the `allowedMimeTypes` array in `uploadMiddleware.js`:

```javascript
const allowedMimeTypes = [
  // Add your custom types
  "application/custom",
  // Remove unwanted types
  // "video/mp4",  // Disable video uploads
];
```

## Best Practices

1. **Always use authentication** before upload middleware
2. **Add logging** for production environments
3. **Validate file content** on the client side first
4. **Implement cleanup** for failed uploads
5. **Use HTTPS** for production file uploads
6. **Monitor storage usage** regularly

## Troubleshooting

### Common Issues

**File not uploading**

- Check file size (max 50MB)
- Verify file type is supported
- Ensure `name="file"` in form
- Check authentication token

**Directory permission errors**

- Ensure write permissions on `/images/chat/`
- Check if directory exists and is writable

**Memory issues with large files**

- Files are streamed directly to disk
- Check available disk space
- Monitor server memory usage

### Debug Mode

Enable detailed logging:

```javascript
// Add to your route
router.post(
  "/upload",
  protect,
  uploadChatMedia,
  (req, res, next) => {
    console.log("Upload debug:", {
      file: req.file,
      body: req.body,
      user: req.user?.id,
    });
    next();
  },
  controller
);
```
