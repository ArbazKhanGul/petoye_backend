# Admin Backend Documentation

## Overview
This is the complete admin backend system for the Petoye application. The admin system allows administrators to manage users, posts, pet listings, and view comprehensive analytics.

## Admin Features

### Authentication
- Admin login with email and password
- Session management with JWT tokens
- Refresh token functionality
- Secure logout
- Password change
- Profile management

### User Management
- View all users with pagination and filters
- Search users
- View detailed user information
- Update user details
- Delete users
- Verify user emails manually
- Manage user tokens (add/subtract/set)
- View user activity (posts, tokens, notifications)
- User statistics dashboard

### Post Management
- View all posts with pagination and filters
- Search posts
- View post details with likes and comments
- Update post content
- Delete posts (single or multiple)
- View posts by specific user
- Post statistics and analytics

### Pet Listing Management
- View all pet listings with pagination and filters
- Search pet listings
- View pet listing details
- Update pet listing information
- Delete pet listings (single or multiple)
- Update pet listing status (active/sold/unavailable)
- View pet listings by owner
- Pet listing statistics

### Analytics & Reports
- Dashboard overview with key metrics
- User growth analytics
- Post activity analytics
- Top users by various metrics (posts, followers, tokens)
- Engagement metrics
- Token economy analytics
- Content moderation statistics

## API Endpoints

### Base URL
All admin endpoints are prefixed with `/api/admin`

### Authentication Endpoints

#### POST `/api/admin/auth/login`
Login as admin
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

#### POST `/api/admin/auth/logout`
Logout (requires auth token)

#### GET `/api/admin/auth/profile`
Get admin profile (requires auth token)

#### PUT `/api/admin/auth/profile`
Update admin profile (requires auth token)
```json
{
  "fullName": "Admin Name",
  "phoneNumber": "+1234567890",
  "profileImage": "https://example.com/image.jpg"
}
```

#### PUT `/api/admin/auth/change-password`
Change admin password (requires auth token)
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

#### POST `/api/admin/auth/refresh-token`
Refresh access token
```json
{
  "refreshToken": "your_refresh_token"
}
```

### User Management Endpoints

#### GET `/api/admin/users`
Get all users with pagination
Query params: `page`, `limit`, `search`, `role`, `emailVerify`, `sortBy`, `sortOrder`

#### GET `/api/admin/users/stats`
Get user statistics

#### GET `/api/admin/users/search?query=searchterm`
Search users

#### GET `/api/admin/users/:userId`
Get user by ID with detailed information

#### PUT `/api/admin/users/:userId`
Update user information
```json
{
  "fullName": "User Name",
  "username": "username",
  "email": "user@example.com",
  "bio": "User bio",
  "country": "Country",
  "phoneNumber": "+1234567890",
  "role": "user"
}
```

#### DELETE `/api/admin/users/:userId`
Delete user and all related data

#### PUT `/api/admin/users/:userId/verify-email`
Manually verify user email

#### PUT `/api/admin/users/:userId/tokens`
Update user tokens
```json
{
  "tokens": 100,
  "action": "add" // or "set" or "subtract"
}
```

#### GET `/api/admin/users/:userId/activity`
Get user activity
Query params: `limit`, `activityType` (all/posts/tokens/notifications)

### Post Management Endpoints

#### GET `/api/admin/posts`
Get all posts with pagination
Query params: `page`, `limit`, `search`, `userId`, `hasMedia`, `sortBy`, `sortOrder`

#### GET `/api/admin/posts/stats`
Get post statistics

#### GET `/api/admin/posts/search?query=searchterm`
Search posts

#### GET `/api/admin/posts/:postId`
Get post by ID with likes and comments

#### PUT `/api/admin/posts/:postId`
Update post
```json
{
  "content": "Updated content"
}
```

#### DELETE `/api/admin/posts/:postId`
Delete post and associated data

#### POST `/api/admin/posts/delete-multiple`
Delete multiple posts
```json
{
  "postIds": ["postId1", "postId2", "postId3"]
}
```

#### GET `/api/admin/posts/user/:userId`
Get posts by specific user

### Pet Listing Endpoints

#### GET `/api/admin/pets`
Get all pet listings with pagination
Query params: `page`, `limit`, `search`, `status`, `type`, `gender`, `isVaccinated`, `ownerId`, `sortBy`, `sortOrder`

#### GET `/api/admin/pets/stats`
Get pet listing statistics

#### GET `/api/admin/pets/search?query=searchterm`
Search pet listings

#### GET `/api/admin/pets/:petId`
Get pet listing by ID

#### PUT `/api/admin/pets/:petId`
Update pet listing

#### DELETE `/api/admin/pets/:petId`
Delete pet listing

#### PUT `/api/admin/pets/:petId/status`
Update pet listing status
```json
{
  "status": "sold" // or "active" or "unavailable"
}
```

#### POST `/api/admin/pets/delete-multiple`
Delete multiple pet listings
```json
{
  "petIds": ["petId1", "petId2", "petId3"]
}
```

#### GET `/api/admin/pets/owner/:ownerId`
Get pet listings by owner

### Analytics Endpoints

#### GET `/api/admin/analytics/dashboard`
Get dashboard overview statistics

#### GET `/api/admin/analytics/user-growth`
Get user growth analytics
Query params: `period` (7days/30days/90days/1year)

#### GET `/api/admin/analytics/post-activity`
Get post activity analytics
Query params: `period` (7days/30days/90days)

#### GET `/api/admin/analytics/top-users`
Get top users
Query params: `limit`, `sortBy` (posts/followers/tokens)

#### GET `/api/admin/analytics/engagement`
Get engagement metrics
Query params: `period` (7days/30days/90days)

#### GET `/api/admin/analytics/token-economy`
Get token economy analytics
Query params: `period` (7days/30days/90days)

#### GET `/api/admin/analytics/content-moderation`
Get content moderation statistics

## Authentication

All admin endpoints (except login and refresh-token) require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Creating First Admin User

Run the seed script to create your first admin user:

```bash
node scripts/seedAdmin.js
```

This will create an admin with:
- Email: admin@petoye.com
- Password: Admin@123456

**Important: Change this password immediately after first login!**

## Security Notes

1. All admin sessions are tracked in the SessionToken collection
2. Tokens expire after 24 hours
3. Refresh tokens are valid for 7 days
4. Admin accounts can be deactivated by setting `isActive: false`
5. All admin actions should be logged for audit purposes (recommended enhancement)

## Error Handling

The admin backend uses the same error middleware as the main app. All errors return in this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {
    // Response data
  }
}
```

Paginated responses include pagination metadata:

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

## File Structure

```
petoye_backend/src/admin/
├── controllers/
│   ├── adminAuthController.js      # Admin authentication
│   ├── adminUserController.js       # User management
│   ├── adminPostController.js       # Post management
│   ├── adminPetController.js        # Pet listing management
│   └── adminAnalyticsController.js  # Analytics and reports
├── middleware/
│   └── adminAuthMiddleware.js       # Admin authentication middleware
├── models/
│   └── admin.model.js               # Admin data model
├── routes/
│   └── adminRoutes.js               # All admin routes
└── validation/
    └── adminValidation.js           # Request validation schemas
```

## Future Enhancements

1. **Role-based permissions** - Add different admin roles (super_admin, moderator, etc.)
2. **Activity logging** - Log all admin actions for audit trail
3. **Bulk operations** - More bulk operations for efficiency
4. **Advanced filters** - More filtering options for all list endpoints
5. **Export functionality** - Export data to CSV/Excel
6. **Email notifications** - Notify admins of important events
7. **Two-factor authentication** - Enhanced security for admin accounts
8. **Admin activity dashboard** - Track what each admin does
