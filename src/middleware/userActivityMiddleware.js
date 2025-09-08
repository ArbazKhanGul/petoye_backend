const UserActivityLog = require("../models/userActivityLog.model");

// Helper function to extract device info from request
const extractDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  
  return {
    deviceModel: req.headers["x-device-model"] || extractDeviceModel(userAgent),
    osVersion: req.headers["x-os-version"] || extractOSVersion(userAgent),
    deviceType: req.headers["x-device-type"] || extractDeviceType(userAgent),
    appVersion: req.headers["x-app-version"] || "unknown",
    fcmToken: req.headers["x-fcm-token"] || req.body.fcmToken || null,
  };
};

// Helper function to extract session info from request
const extractSessionInfo = (req) => {
  return {
    sessionId: req.headers["x-session-id"] || null,
    authToken: req.headers.authorization?.replace("Bearer ", "") || null,
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"]?.split(",")[0]?.trim(),
    userAgent: req.headers["user-agent"] || "",
  };
};

// Helper function to extract location info (basic implementation)
const extractLocationInfo = (req) => {
  // In production, you might want to use a GeoIP service
  return {
    country: req.headers["cf-ipcountry"] || req.headers["x-country"] || null,
    city: req.headers["x-city"] || null,
    coordinates: {
      latitude: req.headers["x-latitude"] ? parseFloat(req.headers["x-latitude"]) : null,
      longitude: req.headers["x-longitude"] ? parseFloat(req.headers["x-longitude"]) : null,
    },
  };
};

// Helper functions to parse user agent
const extractDeviceModel = (userAgent) => {
  // Basic device model extraction
  const deviceMatch = userAgent.match(/\(([^)]+)\)/);
  return deviceMatch ? deviceMatch[1].split(";")[0].trim() : "unknown";
};

const extractOSVersion = (userAgent) => {
  // Basic OS version extraction
  if (userAgent.includes("Android")) {
    const match = userAgent.match(/Android ([^;]+)/);
    return match ? `Android ${match[1]}` : "Android";
  } else if (userAgent.includes("iPhone OS") || userAgent.includes("iOS")) {
    const match = userAgent.match(/OS ([^\s]+)/);
    return match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
  } else if (userAgent.includes("Windows")) {
    return "Windows";
  } else if (userAgent.includes("Mac OS")) {
    return "macOS";
  }
  return "unknown";
};

const extractDeviceType = (userAgent) => {
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
    return "mobile";
  } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
    return "tablet";
  }
  return "web";
};

// Main middleware function
const logUserActivity = (actionType, options = {}) => {
  return async (req, res, next) => {
    // Store the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    let responseStatus = null;

    // Override response methods to capture data
    res.send = function(data) {
      responseData = data;
      responseStatus = res.statusCode;
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      responseData = data;
      responseStatus = res.statusCode;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log the activity after response is sent
    res.on('finish', async () => {
      try {
        // Only log if we have a user ID
        const userId = req.user?._id || req.body?.userId || options.getUserId?.(req);
        if (!userId) return;

        // Determine target information
        let targetType = options.targetType;
        let targetId = options.targetId;

        // Extract target info from request/response if not provided
        if (options.extractTarget) {
          const targetInfo = options.extractTarget(req, responseData);
          targetType = targetInfo.type;
          targetId = targetInfo.id;
        }

        // Build activity details
        const details = {
          method: req.method,
          path: req.path,
          query: req.query,
          ...options.details,
          ...(options.extractDetails ? options.extractDetails(req, responseData) : {}),
        };

        // Create activity log entry
        await UserActivityLog.create({
          userId,
          action: actionType,
          targetType,
          targetId,
          details,
          deviceInfo: extractDeviceInfo(req),
          sessionInfo: extractSessionInfo(req),
          location: extractLocationInfo(req),
          metadata: {
            success: responseStatus >= 200 && responseStatus < 400,
            errorMessage: responseStatus >= 400 ? responseData?.message || "Error occurred" : null,
            fromScreen: req.headers["x-from-screen"] || null,
            toScreen: req.headers["x-to-screen"] || null,
            duration: options.duration || null,
          },
        });
      } catch (error) {
        // Log the error but don't affect the response
        console.error("Error logging user activity:", error);
      }
    });
  };
};

// Specific middleware functions for common actions
const logLogin = logUserActivity("LOGIN", {
  extractTarget: (req, responseData) => ({ type: "User", id: req.user?._id }),
  extractDetails: (req, responseData) => ({
    loginMethod: req.body.loginMethod || "email",
    rememberMe: req.body.rememberMe || false,
  }),
});

const logLogout = logUserActivity("LOGOUT", {
  extractTarget: (req, responseData) => ({ type: "User", id: req.user?._id }),
});

const logPostCreate = logUserActivity("POST_CREATE", {
  targetType: "Post",
  extractTarget: (req, responseData) => ({ 
    type: "Post", 
    id: responseData?.post?._id || responseData?.data?.post?._id 
  }),
  extractDetails: (req, responseData) => ({
    contentLength: req.body.content?.length || 0,
    hasMedia: !!(req.body.mediaFiles && req.body.mediaFiles.length > 0),
    mediaCount: req.body.mediaFiles?.length || 0,
  }),
});

const logPostUpdate = logUserActivity("POST_UPDATE", {
  targetType: "Post",
  extractTarget: (req, responseData) => ({ 
    type: "Post", 
    id: req.params.id || req.params.postId 
  }),
});

const logPostDelete = logUserActivity("POST_DELETE", {
  targetType: "Post",
  extractTarget: (req, responseData) => ({ 
    type: "Post", 
    id: req.params.id || req.params.postId 
  }),
});

const logLike = logUserActivity("LIKE_ADD", {
  targetType: "Post",
  extractTarget: (req, responseData) => ({ 
    type: "Post", 
    id: req.params.postId || req.body.postId 
  }),
});

const logUnlike = logUserActivity("LIKE_REMOVE", {
  targetType: "Post",
  extractTarget: (req, responseData) => ({ 
    type: "Post", 
    id: req.params.postId || req.body.postId 
  }),
});

const logComment = logUserActivity("COMMENT_ADD", {
  targetType: "Post",
  extractTarget: (req, responseData) => ({ 
    type: "Post", 
    id: req.params.postId || req.body.postId 
  }),
  extractDetails: (req, responseData) => ({
    contentLength: req.body.content?.length || 0,
    isReply: !!req.body.parentComment,
  }),
});

const logFollow = logUserActivity("FOLLOW_ADD", {
  targetType: "User",
  extractTarget: (req, responseData) => ({ 
    type: "User", 
    id: req.params.userId || req.body.followingId 
  }),
});

const logUnfollow = logUserActivity("FOLLOW_REMOVE", {
  targetType: "User",
  extractTarget: (req, responseData) => ({ 
    type: "User", 
    id: req.params.userId || req.body.followingId 
  }),
});

const logProfileUpdate = logUserActivity("PROFILE_UPDATE", {
  targetType: "User",
  extractTarget: (req, responseData) => ({ type: "User", id: req.user?._id }),
  extractDetails: (req, responseData) => ({
    updatedFields: Object.keys(req.body),
  }),
});

const logPasswordChange = logUserActivity("PASSWORD_CHANGE", {
  targetType: "User",
  extractTarget: (req, responseData) => ({ type: "User", id: req.user?._id }),
});

const logOtpRequest = logUserActivity("OTP_REQUEST", {
  extractDetails: (req, responseData) => ({
    otpType: req.body.type || "email",
    destination: req.body.email || req.body.phone,
  }),
});

const logOtpVerify = logUserActivity("OTP_VERIFY", {
  extractDetails: (req, responseData) => ({
    otpType: req.body.type || "email",
    success: responseData?.success || false,
  }),
});

const logMessageSend = logUserActivity("MESSAGE_SEND", {
  targetType: "Message",
  extractTarget: (req, responseData) => ({ 
    type: "Message", 
    id: responseData?.message?._id 
  }),
  extractDetails: (req, responseData) => ({
    messageType: req.body.type || "text",
    hasMedia: !!(req.body.media),
    recipientId: req.body.recipient || req.params.recipientId,
  }),
});

const logAppOpen = logUserActivity("APP_OPEN", {
  extractDetails: (req, responseData) => ({
    source: req.body.source || "unknown",
  }),
});

const logScreenView = logUserActivity("SCREEN_VIEW", {
  extractDetails: (req, responseData) => ({
    screenName: req.body.screenName || req.headers["x-screen-name"],
    previousScreen: req.body.previousScreen || req.headers["x-previous-screen"],
  }),
});

module.exports = {
  logUserActivity,
  logLogin,
  logLogout,
  logPostCreate,
  logPostUpdate,
  logPostDelete,
  logLike,
  logUnlike,
  logComment,
  logFollow,
  logUnfollow,
  logProfileUpdate,
  logPasswordChange,
  logOtpRequest,
  logOtpVerify,
  logMessageSend,
  logAppOpen,
  logScreenView,
};
