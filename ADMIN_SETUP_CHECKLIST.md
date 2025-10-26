# 🚀 Admin Backend Setup Checklist

Follow these steps to get your admin backend up and running:

## ✅ Prerequisites
- [ ] MongoDB is running
- [ ] Node.js is installed
- [ ] All backend dependencies are installed (`npm install`)
- [ ] `.env` file is configured with required variables

## 📋 Setup Steps

### Step 1: Verify Environment Variables
Make sure your `.env` file contains:
```env
MONGO_URI=your_mongodb_connection_string
SECRET_KEY_JSON_WEB_TOKEN_LOGIN=your_jwt_secret
SECRET_KEY_JSON_WEB_TOKEN_REFRESH=your_refresh_token_secret
PORT=your_port_number
```

### Step 2: Create First Admin User
```bash
cd petoye_backend
node scripts/seedAdmin.js
```

**Expected Output:**
```
✅ Admin user created successfully!

================================
Admin Login Credentials:
================================
Email:    admin@petoye.com
Password: Admin@123456
================================
```

### Step 3: Start Your Backend Server
```bash
npm start
# or
npm run dev
```

**Expected Output:**
```
✅ MongoDB connected
🚀 Server listening on port YOUR_PORT
📱 Socket.IO ready for real-time communication
```

### Step 4: Test Admin Login
Use Postman, Thunder Client, or any API testing tool:

```
POST http://localhost:YOUR_PORT/api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@petoye.com",
  "password": "Admin@123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "admin": {
      "_id": "...",
      "fullName": "Petoye Admin",
      "email": "admin@petoye.com",
      "role": "super_admin",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 5: Save Your Tokens
- [ ] Copy the `authToken` from the response
- [ ] Use it in all subsequent requests as: `Authorization: Bearer YOUR_TOKEN`

### Step 6: Test Other Endpoints
Try these to verify everything works:

**Get Dashboard Stats:**
```
GET http://localhost:YOUR_PORT/api/admin/analytics/dashboard
Authorization: Bearer YOUR_TOKEN
```

**Get All Users:**
```
GET http://localhost:YOUR_PORT/api/admin/users?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

**Get All Posts:**
```
GET http://localhost:YOUR_PORT/api/admin/posts?page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

### Step 7: Change Default Password (IMPORTANT!)
```
PUT http://localhost:YOUR_PORT/api/admin/auth/change-password
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "currentPassword": "Admin@123456",
  "newPassword": "YourNewSecurePassword123!"
}
```

## 🎯 Verification Checklist

After setup, verify these work:
- [ ] Admin can login
- [ ] Admin can view dashboard stats
- [ ] Admin can see all users
- [ ] Admin can see all posts
- [ ] Admin can update a user
- [ ] Admin can delete a post
- [ ] Admin can view analytics
- [ ] Admin can change password
- [ ] Admin can logout

## 📁 Files Created

Verify these files exist:
- [ ] `src/admin/models/admin.model.js`
- [ ] `src/admin/controllers/adminAuthController.js`
- [ ] `src/admin/controllers/adminUserController.js`
- [ ] `src/admin/controllers/adminPostController.js`
- [ ] `src/admin/controllers/adminPetController.js`
- [ ] `src/admin/controllers/adminAnalyticsController.js`
- [ ] `src/admin/controllers/adminContentController.js`
- [ ] `src/admin/middleware/adminAuthMiddleware.js`
- [ ] `src/admin/routes/adminRoutes.js`
- [ ] `src/admin/validation/adminValidation.js`
- [ ] `scripts/seedAdmin.js`
- [ ] `docs/ADMIN_BACKEND.md`
- [ ] `docs/ADMIN_API_TESTING.md`
- [ ] `ADMIN_IMPLEMENTATION_SUMMARY.md`

## 🔧 Troubleshooting

### Issue: "Admin user already exists"
**Solution:** The admin was already created. If you forgot the password, you can:
1. Delete the admin from MongoDB
2. Run the seed script again

### Issue: "MongoDB connection error"
**Solution:** 
1. Check if MongoDB is running
2. Verify MONGO_URI in .env file
3. Check network connectivity

### Issue: "Invalid or expired token"
**Solution:**
1. Token might have expired (24 hours)
2. Login again to get a new token
3. Use the refresh token endpoint

### Issue: "Authorization token missing"
**Solution:**
1. Make sure you're including the Authorization header
2. Format: `Authorization: Bearer YOUR_TOKEN`
3. No extra spaces or quotes

### Issue: "Access denied. Admin privileges required"
**Solution:**
1. You're using a regular user token, not an admin token
2. Login through the admin login endpoint
3. Make sure the admin account has `type: "admin"` in JWT

## 📚 Next Steps

1. **Read the Documentation**
   - `docs/ADMIN_BACKEND.md` - Complete feature documentation
   - `docs/ADMIN_API_TESTING.md` - API testing examples

2. **Integrate with Frontend**
   - Use the admin panel of your choice
   - All endpoints return consistent JSON
   - Ready for React, Vue, Angular, or Next.js admin panels

3. **Customize**
   - Add more admin roles
   - Add activity logging
   - Add email notifications
   - Add 2FA for extra security

4. **Deploy**
   - Make sure to change default credentials
   - Use environment variables for secrets
   - Enable HTTPS in production
   - Set up rate limiting

## ✨ Success!

If all checkboxes are checked, your admin backend is ready to use! 🎉

---

**For detailed API documentation, see:** `docs/ADMIN_API_TESTING.md`

**For feature overview, see:** `ADMIN_IMPLEMENTATION_SUMMARY.md`
