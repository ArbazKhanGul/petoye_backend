# PetOye Backend

## Setup Instructions

### Prerequisites

1. Node.js (v14 or later)
2. MongoDB
3. FFmpeg (for video thumbnail generation)

### FFmpeg Installation

FFmpeg is required for generating thumbnails from video uploads. Install it based on your operating system:

#### Windows

1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract the files to a location on your computer (e.g., `C:\ffmpeg`)
3. Add the FFmpeg `bin` folder to your system's PATH environment variable

#### Mac

```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/petoye
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRES_IN=30d
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Features

- User authentication (signup, login, refresh token)
- Post creation and management
- Media uploads (images and videos)
- Video thumbnail generation
- User profiles
- Social interactions (likes, comments)

## API Documentation

API documentation is available at `/api-docs` when the server is running.
