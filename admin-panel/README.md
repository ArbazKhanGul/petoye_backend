# Petoye Admin Panel

A modern, responsive admin panel for managing the Petoye application built with Next.js and Tailwind CSS.

## Features

### 🔐 Authentication & Security
- JWT-based admin authentication
- Role-based access control (Super Admin, Admin, Moderator)
- Automatic token refresh
- Session management
- Audit logging for all admin actions

### 📊 Dashboard Overview
- Total users, active sessions, and key metrics
- User growth charts
- Recent user activity
- Recent posts overview

### 👥 User Management
- View all users with pagination
- Search and filter users
- Edit user details (name, email, verification status, tokens)
- Delete users and related data
- Export user data (CSV/JSON)

### 🪙 Token Management
- View all token transactions
- Filter by transaction type (likes, referrals, admin adjustments)
- Manually adjust user tokens
- Track token distribution

### 📝 Post Management
- View all posts with media preview
- Search posts by content
- Delete inappropriate posts
- View post engagement metrics

### 📋 Audit Logs
- Track all admin actions
- Filter by action type
- View detailed action information
- IP address and user agent tracking

## Setup Instructions

### Backend Setup

1. **Create Super Admin Account**
   ```bash
   cd petoye_backend
   npm run create:admin
   ```
   This creates a super admin with:
   - Email: admin@petoye.com
   - Password: Admin@123456

2. **Start Backend Server**
   ```bash
   npm run dev
   ```

### Admin Panel Setup

1. **Install Dependencies**
   ```bash
   cd admin-panel
   npm install
   ```

2. **Configure Environment**
   Create `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Start Admin Panel**
   ```bash
   npm run dev
   ```

4. **Access Admin Panel**
   - URL: http://localhost:3001
   - Email: admin@petoye.com
   - Password: Admin@123456

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript** - ES6+ features

### Backend Integration
- **REST API** - Communication with backend
- **JWT Authentication** - Secure admin sessions
- **File Export** - CSV/JSON data export

## Admin Roles & Permissions

### Super Admin
- All permissions
- Can manage other admins
- Full system access

### Admin
- User management
- Post management
- Token management
- Analytics view

### Moderator
- Post management only
- Limited user viewing

## Security Features

- **Token-based Authentication** - JWT tokens with automatic refresh
- **Session Management** - Active session tracking
- **Audit Logging** - All actions are logged with details
- **Role-based Access** - Granular permission system
- **IP Tracking** - Monitor admin access locations

## API Endpoints

### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `POST /api/admin/auth/refresh-token` - Refresh tokens

### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics

### User Management
- `GET /api/admin/users` - List users with pagination
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Post Management
- `GET /api/admin/posts` - List posts
- `DELETE /api/admin/posts/:id` - Delete post

### Token Management
- `GET /api/admin/tokens/transactions` - List token transactions
- `POST /api/admin/tokens/adjust` - Adjust user tokens

### Data Export
- `GET /api/admin/export/users?format=csv|json` - Export users

### Audit Logs
- `GET /api/admin/audit-logs` - Get audit logs

## Usage Guide

### First Time Setup
1. Start the backend server
2. Run `npm run create:admin` to create super admin
3. Start the admin panel
4. Login with the super admin credentials
5. Change the default password

### Managing Users
- Search users by name, email, or username
- Filter by verification status
- Edit user details in modal
- Export user data for reports

### Managing Posts
- Browse all posts with media previews
- Search posts by content
- Delete inappropriate content
- Monitor engagement metrics

### Token System
- View all token transactions
- Manually adjust user balances
- Track referral rewards
- Monitor like rewards

### Audit Trail
- All admin actions are automatically logged
- View detailed action history
- Filter by action type or admin
- Track system changes

## Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Update this README for new features

## Support

For issues or questions:
1. Check the audit logs for errors
2. Review the backend API responses
3. Check browser console for frontend errors
