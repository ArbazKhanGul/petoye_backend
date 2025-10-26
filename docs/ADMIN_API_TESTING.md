# Admin API Testing Guide

This file contains sample requests for testing all admin endpoints.

## Setup
1. Set your base URL: `http://localhost:YOUR_PORT/api/admin`
2. After login, save the `authToken` and use it in the Authorization header
3. Format: `Authorization: Bearer YOUR_AUTH_TOKEN`

---

## 1. AUTHENTICATION

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "admin@petoye.com",
  "password": "Admin@123456"
}
```

### Get Profile
```
GET /auth/profile
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Update Profile
```
PUT /auth/profile
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "fullName": "Updated Admin Name",
  "phoneNumber": "+1234567890"
}
```

### Change Password
```
PUT /auth/change-password
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "currentPassword": "Admin@123456",
  "newPassword": "NewSecurePassword123!"
}
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## 2. USER MANAGEMENT

### Get All Users
```
GET /users?page=1&limit=20&search=john&role=user&emailVerify=true&sortBy=createdAt&sortOrder=desc
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get User Stats
```
GET /users/stats
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Search Users
```
GET /users/search?query=john&limit=10
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get User by ID
```
GET /users/:userId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Update User
```
PUT /users/:userId
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "fullName": "Updated Name",
  "username": "newusername",
  "email": "newemail@example.com",
  "bio": "Updated bio",
  "country": "USA",
  "phoneNumber": "+1234567890",
  "role": "user"
}
```

### Delete User
```
DELETE /users/:userId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Verify User Email
```
PUT /users/:userId/verify-email
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Update User Tokens
```
PUT /users/:userId/tokens
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "tokens": 100,
  "action": "add"
}
// action can be: "set", "add", or "subtract"
```

### Get User Activity
```
GET /users/:userId/activity?limit=20&activityType=all
Authorization: Bearer YOUR_AUTH_TOKEN
// activityType: all, posts, tokens, notifications
```

---

## 3. POST MANAGEMENT

### Get All Posts
```
GET /posts?page=1&limit=20&search=cat&userId=USER_ID&hasMedia=true&sortBy=createdAt&sortOrder=desc
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get Post Stats
```
GET /posts/stats
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Search Posts
```
GET /posts/search?query=cat&limit=20
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get Post by ID
```
GET /posts/:postId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Update Post
```
PUT /posts/:postId
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "content": "Updated post content"
}
```

### Delete Post
```
DELETE /posts/:postId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Multiple Posts
```
POST /posts/delete-multiple
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "postIds": ["postId1", "postId2", "postId3"]
}
```

### Get Posts by User
```
GET /posts/user/:userId?page=1&limit=20
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## 4. PET LISTING MANAGEMENT

### Get All Pet Listings
```
GET /pets?page=1&limit=20&search=dog&status=active&type=dog&gender=male&isVaccinated=true&ownerId=USER_ID
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get Pet Listing Stats
```
GET /pets/stats
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Search Pet Listings
```
GET /pets/search?query=labrador&limit=20
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get Pet Listing by ID
```
GET /pets/:petId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Update Pet Listing
```
PUT /pets/:petId
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "name": "Updated Pet Name",
  "price": 500,
  "description": "Updated description",
  "status": "active"
}
```

### Update Pet Listing Status
```
PUT /pets/:petId/status
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "status": "sold"
}
// status: active, sold, unavailable
```

### Delete Pet Listing
```
DELETE /pets/:petId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Multiple Pet Listings
```
POST /pets/delete-multiple
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "petIds": ["petId1", "petId2", "petId3"]
}
```

### Get Pet Listings by Owner
```
GET /pets/owner/:ownerId?page=1&limit=20
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## 5. ANALYTICS

### Get Dashboard Stats
```
GET /analytics/dashboard
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get User Growth Analytics
```
GET /analytics/user-growth?period=30days
Authorization: Bearer YOUR_AUTH_TOKEN
// period: 7days, 30days, 90days, 1year
```

### Get Post Activity Analytics
```
GET /analytics/post-activity?period=30days
Authorization: Bearer YOUR_AUTH_TOKEN
// period: 7days, 30days, 90days
```

### Get Top Users
```
GET /analytics/top-users?limit=10&sortBy=posts
Authorization: Bearer YOUR_AUTH_TOKEN
// sortBy: posts, followers, tokens
```

### Get Engagement Metrics
```
GET /analytics/engagement?period=30days
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get Token Economy Analytics
```
GET /analytics/token-economy?period=30days
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get Content Moderation Stats
```
GET /analytics/content-moderation
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## 6. COMMENT MANAGEMENT

### Get All Comments
```
GET /comments?page=1&limit=20&postId=POST_ID&userId=USER_ID
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Comment
```
DELETE /comments/:commentId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Multiple Comments
```
POST /comments/delete-multiple
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "commentIds": ["commentId1", "commentId2", "commentId3"]
}
```

---

## 7. NOTIFICATION MANAGEMENT

### Get All Notifications
```
GET /notifications?page=1&limit=20&userId=USER_ID&type=post_like&isRead=false
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Notification
```
DELETE /notifications/:notificationId
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## 8. CHAT/MESSAGE MANAGEMENT

### Get All Conversations
```
GET /conversations?page=1&limit=20
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Get Conversation Messages
```
GET /conversations/:conversationId/messages?page=1&limit=50
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Conversation
```
DELETE /conversations/:conversationId
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Message
```
DELETE /messages/:messageId
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## 9. FOLLOW MANAGEMENT

### Get All Follows
```
GET /follows?page=1&limit=20&followerId=USER_ID&followingId=USER_ID
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Follow
```
DELETE /follows/:followId
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## 10. LIKE MANAGEMENT

### Get All Likes
```
GET /likes?page=1&limit=20&postId=POST_ID&userId=USER_ID
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Delete Like
```
DELETE /likes/:likeId
Authorization: Bearer YOUR_AUTH_TOKEN
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Optional message",
  "data": {
    // Response data
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

---

## Testing Workflow

1. **Create Admin User**
   ```bash
   node scripts/seedAdmin.js
   ```

2. **Login**
   - Use POST /auth/login with default credentials
   - Save the authToken from response

3. **Test User Management**
   - Get all users
   - View a specific user
   - Update user tokens
   - Check user activity

4. **Test Post Management**
   - Get all posts
   - View post details
   - Delete inappropriate posts

5. **Test Analytics**
   - Check dashboard stats
   - View user growth
   - Check engagement metrics

6. **Change Password**
   - Use the change password endpoint
   - Logout and login with new password

---

## Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Admin privileges required
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error
