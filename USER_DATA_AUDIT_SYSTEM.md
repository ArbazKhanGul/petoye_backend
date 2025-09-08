# Complete User Data and Audit System Documentation

## Overview
This system provides comprehensive user monitoring, audit trails, and detailed user information for admin panel management. Every user action is tracked and stored for complete transparency and security.

## 📊 Available User Data Models

### 1. **User Model (`user.model.js`)**
**Basic user profile information:**
- Personal info: fullName, username, bio, email, phone, country, dateOfBirth
- Authentication: password (hashed), emailVerify status
- Profile: profileImage, role (user/admin)
- Tokens: fcmTokens[], refreshTokens[], referralCode, tokens balance
- Social: followersCount, followingCount
- Timestamps: createdAt, updatedAt

### 2. **OTP Model (`otp.model.js`)**
**All OTP verification records:**
- userId (reference to user)
- type: "email", "phone", "forgot"
- value: OTP code (shown as masked in admin panel for security)
- expiration: when OTP expires
- status: boolean (used/unused)
- createdAt: when OTP was generated

### 3. **Session Token Model (`sessionToken.model.js`)**
**Login session and device tracking:**
- userId (reference to user)
- authToken, refreshToken, fcmToken
- Device info: deviceModel, osVersion, deviceType, appVersion
- Session: createdAt, expiresAt, revoked status, revokedAt
- Security: tracks all login sessions per device

### 4. **User Activity Log Model (`userActivityLog.model.js`)** ⭐ NEW
**Comprehensive activity tracking:**
- **Authentication Actions**: LOGIN, LOGOUT, PASSWORD_CHANGE, EMAIL_VERIFY, OTP_REQUEST, OTP_VERIFY
- **Profile Actions**: PROFILE_UPDATE, PROFILE_IMAGE_UPDATE, USERNAME_CHANGE
- **Content Actions**: POST_CREATE, POST_UPDATE, POST_DELETE, POST_VIEW
- **Interaction Actions**: LIKE_ADD, LIKE_REMOVE, COMMENT_ADD, COMMENT_UPDATE, COMMENT_DELETE
- **Social Actions**: FOLLOW_ADD, FOLLOW_REMOVE
- **Pet Listing Actions**: PET_LISTING_CREATE, PET_LISTING_UPDATE, PET_LISTING_DELETE
- **Communication**: MESSAGE_SEND, MESSAGE_READ, CONVERSATION_CREATE
- **App Usage**: APP_OPEN, APP_CLOSE, SCREEN_VIEW
- **Device & Location Data**: Complete device fingerprinting and location tracking

### 5. **Content & Interaction Models**
- **Posts**: All user posts with media, likes/comments counts
- **Comments**: User comments on posts (with reply threading)
- **Likes**: User likes on posts (with post owner tracking)
- **Follow**: User follow relationships (scalable design)
- **Pet Listings**: User pet sale listings
- **Token Transactions**: All token earnings and spending
- **Referrals**: User referral activities
- **Messages/Conversations**: Chat history
- **Notifications**: All user notifications

### 6. **Admin Audit Model (`auditLog.model.js`)**
**Admin action tracking:**
- Tracks all admin actions on users, posts, tokens, etc.
- Includes IP address, user agent, old/new data for rollbacks

## 🔧 Admin Panel Features

### **Enhanced User Detail Page** (`/dashboard/users/[id]`)

#### **Overview Tab**
- **Account Information**: Complete profile with verification status
- **Account Health Indicators**:
  - Email verification status
  - Profile completion percentage
  - Active session indicator
  - Risk level assessment (low/medium/high)
- **Device Usage Statistics**: Breakdown by device type
- **Bio and personal information**

#### **Activity Logs Tab**
- **Complete User Activity Timeline**:
  - All user actions with timestamps
  - Device information for each action
  - Success/failure status
  - Detailed action context
- **Activity Statistics**: Most common actions
- **Filterable by date range and action type**

#### **OTP History Tab**
- **All OTP Records**:
  - OTP type (email/phone/forgot password)
  - Masked OTP values for security (shows only last 2 digits)
  - Expiration status
  - Usage status
  - Time-based filtering
- **Security Analysis**: Failed OTP attempts

#### **Login Sessions Tab**
- **All User Sessions**:
  - Device information (model, OS, app version)
  - Session duration and status
  - Login timestamps and IP addresses
  - **Admin Controls**: Ability to revoke active sessions
- **Security Features**: 
  - Identify suspicious login patterns
  - Force logout from specific devices

#### **Content Tab**
- **Recent Posts**: User's latest posts with engagement metrics
- **Pet Listings**: All pet sale listings
- **Content Statistics**: Posts, media uploads, etc.

#### **Interactions Tab**
- **Token Transactions**: Complete financial history
- **Recent Likes & Comments**: User engagement activity
- **Social Connections**: Followers/following relationships
- **Referral Activity**: Referral codes and rewards

## 🚀 API Endpoints

### **Enhanced User Management**
```
GET /api/admin/users/:id - Get comprehensive user details
GET /api/admin/users/:id/otp-history - Get user OTP history
GET /api/admin/users/:id/activity-logs - Get user activity logs  
GET /api/admin/users/:id/session-history - Get user login sessions
POST /api/admin/users/:userId/sessions/:sessionId/revoke - Revoke user session
```

### **Activity Tracking Middleware**
Automatic activity logging for:
- User authentication (login, logout, password changes)
- Content creation (posts, comments, likes)
- Profile updates
- Social interactions (follows, messages)
- App usage patterns

## 🔐 Security Features

### **Risk Assessment System**
- **Low Risk**: Normal user behavior, verified email, complete profile
- **Medium Risk**: Some failed login attempts or unusual activity patterns  
- **High Risk**: Multiple failed OTPs, suspicious device changes, reported content

### **Session Management**
- Track all active sessions across devices
- Admin ability to revoke sessions remotely
- Automatic session expiry tracking
- Device fingerprinting for security

### **Data Privacy & Security**
- OTP values are masked in admin interface
- Sensitive data is hashed/encrypted
- Audit trail for all admin actions
- IP address and device tracking for security

## 📈 Analytics & Insights

### **User Behavior Analytics**
- **Activity Patterns**: When users are most active
- **Device Preferences**: iOS vs Android vs Web usage
- **Feature Usage**: Most used app features
- **Engagement Metrics**: Posts, likes, comments per user

### **Security Monitoring**
- **Failed Login Attempts**: Track brute force attempts
- **Suspicious Activities**: Unusual location or device changes
- **OTP Abuse**: Multiple OTP requests in short time
- **Session Anomalies**: Concurrent sessions from different locations

### **Content Monitoring**
- **Post Creation Patterns**: When and how often users post
- **Engagement Analysis**: Which content gets most interactions
- **Token Economy**: How users earn and spend tokens
- **Social Network Analysis**: Follow patterns and influence

## 🛠️ Implementation Guide

### **Adding Activity Logging to New Routes**
```javascript
const { logUserActivity } = require("../middleware/userActivityMiddleware");

// Custom activity logging
router.post("/custom-action", 
  authMiddleware,
  logUserActivity("CUSTOM_ACTION", {
    targetType: "Post",
    extractTarget: (req, res) => ({ type: "Post", id: req.params.id }),
    extractDetails: (req, res) => ({ customField: req.body.value })
  }),
  controller.customAction
);

// Pre-built activity loggers
const { logPostCreate, logLogin, logFollow } = require("../middleware/userActivityMiddleware");

router.post("/posts", authMiddleware, logPostCreate, postController.create);
router.post("/login", logLogin, authController.login);
router.post("/follow", authMiddleware, logFollow, followController.follow);
```

### **Custom Activity Logging**
```javascript
const UserActivityLog = require("../models/userActivityLog.model");

// Manual activity logging in controllers
await UserActivityLog.create({
  userId: req.user._id,
  action: "CUSTOM_ACTION",
  targetType: "User",
  targetId: targetUserId,
  details: { reason: "admin_action" },
  deviceInfo: extractDeviceInfo(req),
  sessionInfo: extractSessionInfo(req),
  metadata: { success: true }
});
```

## 📊 Database Indexes & Performance

### **Optimized Queries**
All models include proper indexing for:
- User ID lookups (primary filtering)
- Date range queries (activity analysis)
- Action type filtering
- Device and IP tracking
- Compound indexes for common query patterns

### **Data Retention**
- Activity logs can be configured with TTL for automatic cleanup
- Archive old data for long-term storage
- Maintain recent data for quick access

## 🔍 Advanced Features

### **Real-time Monitoring**
- Live user activity streams
- Real-time session tracking
- Instant security alerts

### **Export & Reporting**
- Export user data in CSV/JSON formats
- Generate user activity reports
- Security incident reports
- GDPR compliance data exports

### **Integration Points**
- Push notification tracking
- Email campaign integration
- Third-party analytics
- Fraud detection systems

## 📝 Future Enhancements

### **Planned Features**
1. **Machine Learning Risk Scoring**: AI-powered user behavior analysis
2. **Geolocation Services**: More detailed location tracking
3. **Advanced Search**: Full-text search across all user activities  
4. **Automated Alerts**: Smart notifications for unusual patterns
5. **Data Visualization**: Charts and graphs for user analytics
6. **API Rate Limiting**: Per-user API usage tracking
7. **Compliance Tools**: GDPR, CCPA data management tools

This comprehensive system provides complete visibility into user behavior while maintaining security and privacy standards. All user actions are tracked, stored, and made available to administrators through an intuitive interface.
