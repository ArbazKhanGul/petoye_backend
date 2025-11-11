const { body, param } = require("express-validator");

// Validation for creating sub-admin
exports.createSubAdminValidation = [
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),

  body("role")
    .optional()
    .isIn(["super_admin", "admin", "moderator", "viewer"])
    .withMessage("Invalid role"),

  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("permissions")
    .optional()
    .isObject()
    .withMessage("Permissions must be an object"),
];

// Validation for updating sub-admin
exports.updateSubAdminValidation = [
  param("adminId")
    .isMongoId()
    .withMessage("Invalid admin ID"),

  body("fullName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("role")
    .optional()
    .isIn(["super_admin", "admin", "moderator", "viewer"])
    .withMessage("Invalid role"),

  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  body("permissions")
    .optional()
    .isObject()
    .withMessage("Permissions must be an object"),
];

// Validation for updating permissions
exports.updatePermissionsValidation = [
  param("adminId")
    .isMongoId()
    .withMessage("Invalid admin ID"),

  body("permissions")
    .isObject()
    .withMessage("Permissions object is required"),

  body("permissions.users")
    .optional()
    .isObject()
    .withMessage("Users permissions must be an object"),

  body("permissions.posts")
    .optional()
    .isObject()
    .withMessage("Posts permissions must be an object"),

  body("permissions.pets")
    .optional()
    .isObject()
    .withMessage("Pets permissions must be an object"),

  body("permissions.admins")
    .optional()
    .isObject()
    .withMessage("Admins permissions must be an object"),
];

// Validation for password reset
exports.resetPasswordValidation = [
  param("adminId")
    .isMongoId()
    .withMessage("Invalid admin ID"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
];

// General admin ID validation
exports.adminIdValidation = [
  param("adminId")
    .isMongoId()
    .withMessage("Invalid admin ID"),
];