const express = require("express");
const validate = require("../middleware/validateMiddleware");
const {
  signupSchema,
  updateProfileSchema,
  addFcmTokenSchema,
  forgotPasswordSendOtpSchema,
  forgotPasswordVerifyOtpSchema,
  forgotPasswordResetSchema,
  updatePasswordSchema,
} = require("../validation/userValidation");
const authController = require("../controllers/authController");
const upload = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");
const logoutSchema = require("../validation/logoutSchema");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email or phone already exists
 */
router.route("/register").post(validate(signupSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             examples:
 *               success:
 *                 value:
 *                   message: Login successful
 *                   user:
 *                     _id: "userId123"
 *                     fullName: "John Doe"
 *                     email: "john@example.com"
 *                     dateOfBirth: "1990-01-01"
 *                     country: "India"
 *                     phoneNumber: "9876543210"
 *                     role: "user"
 *                     profileImage: "/images/profile.png"
 *                     emailVerify: true
 *                   token: "<JWT access token>"
 *                   refreshToken: "<JWT refresh token>"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               error:
 *                 value:
 *                   message: Invalid email or password
 */
router.route("/login").post(authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (soft deletes session)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   message: Logout successful
 *       401:
 *         description: Session invalid or already logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               error:
 *                 value:
 *                   message: Session invalid or logged out
 */
const refreshTokenMiddleware = require("../middleware/refreshTokenMiddleware");

router
  .route("/logout")
  .post(validate(logoutSchema), refreshTokenMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *             examples:
 *               success:
 *                 value:
 *                   token: "<new JWT access token>"
 *                   refreshToken: "<new JWT refresh token>"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               error:
 *                 value:
 *                   message: Invalid or expired refresh token
 */
router.route("/refresh-token").post(authController.refreshToken);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.route("/verify-otp").post(authController.verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent
 */
router.route("/resend-otp").post(authController.resendOtp);

/**
 * @swagger
 * /api/auth/update-profile:
 *   post:
 *     summary: Update user profile
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfile'
 *     responses:
 *       200:
 *         description: Profile updated
 */
router
  .route("/update-profile")
  .post(
    authMiddleware,
    upload.single("profileImage"),
    validate(updateProfileSchema),
    authController.updateProfile
  );

/**
 * @swagger
 * /api/auth/add-fcm-token:
 *   post:
 *     summary: Add FCM token for user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token added
 */
router
  .route("/add-fcm-token")
  .post(
    authMiddleware,
    validate(addFcmTokenSchema),
    authController.addFcmToken
  );

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *               deviceModel:
 *                 type: string
 *               osVersion:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               appVersion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             examples:
 *               success:
 *                 value:
 *                   message: Google login successful
 *                   user:
 *                     _id: "userId123"
 *                     fullName: "John Doe"
 *                     email: "john@example.com"
 *                     dateOfBirth: "1990-01-01"
 *                     country: "India"
 *                     phoneNumber: "9876543210"
 *                     role: "user"
 *                     profileImage: "https://lh3.googleusercontent.com/..."
 *                     emailVerify: true
 *                   token: "<JWT access token>"
 *                   refreshToken: "<JWT refresh token>"
 *       401:
 *         description: Google authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               error:
 *                 value:
 *                   message: Google authentication failed
 */
router.route("/google-login").post(authController.googleLogin);

/**
 * @swagger
 * /api/auth/forgot-password/send-otp:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 */
router
  .route("/forgot-password/send-otp")
  .post(
    validate(forgotPasswordSendOtpSchema),
    authController.forgotPasswordSendOtp
  );

/**
 * @swagger
 * /api/auth/forgot-password/verify-otp:
 *   post:
 *     summary: Verify OTP for password reset
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified for password reset
 */
router
  .route("/forgot-password/verify-otp")
  .post(
    validate(forgotPasswordVerifyOtpSchema),
    authController.forgotPasswordVerifyOtp
  );

/**
 * @swagger
 * /api/auth/forgot-password/reset:
 *   post:
 *     summary: Reset password after OTP verification
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router
  .route("/forgot-password/reset")
  .post(
    validate(forgotPasswordResetSchema),
    authController.forgotPasswordReset
  );

/**
 * @swagger
 * /api/auth/update-password:
 *   post:
 *     summary: Update password from profile
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router
  .route("/update-password")
  .post(
    authMiddleware,
    validate(updatePasswordSchema),
    authController.updatePassword
  );

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.route("/profile").get(authMiddleware, authController.getProfile);

module.exports = router;
