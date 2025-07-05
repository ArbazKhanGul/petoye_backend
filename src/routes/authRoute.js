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
 *       401:
 *         description: Invalid credentials
 */
router.route("/login").post(authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (removes refresh token)
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
 *         description: Logout successful
 */
router.route("/logout").post(authController.logout);

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
 *     responses:
 *       200:
 *         description: Google login successful
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

module.exports = router;
