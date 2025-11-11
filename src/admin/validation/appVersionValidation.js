const { body, param } = require('express-validator');

/**
 * Validation for creating/updating app version
 */
const validateAppVersion = [
  body('platform')
    .isIn(['android', 'ios'])
    .withMessage('Platform must be either android or ios'),

  body('minimumVersion')
    .isString()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('Minimum version must be in format x.y.z (e.g., 1.0.0)'),

  body('latestVersion')
    .isString()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('Latest version must be in format x.y.z (e.g., 1.0.0)')
    .custom((value, { req }) => {
      const minimumParts = req.body.minimumVersion.split('.').map(Number);
      const latestParts = value.split('.').map(Number);
      
      // Compare versions
      for (let i = 0; i < 3; i++) {
        if (latestParts[i] > minimumParts[i]) return true;
        if (latestParts[i] < minimumParts[i]) {
          throw new Error('Latest version must be greater than or equal to minimum version');
        }
      }
      return true;
    }),

  body('updateMessage')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Update message must be between 1 and 200 characters'),

  body('forceUpdateMessage')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Force update message must be between 1 and 200 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

/**
 * Validation for version compatibility check
 */
const validateVersionCheck = [
  body('platform')
    .isIn(['android', 'ios'])
    .withMessage('Platform must be either android or ios'),

  body('currentVersion')
    .isString()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('Current version must be in format x.y.z (e.g., 1.0.0)'),
];

/**
 * Validation for platform parameter
 */
const validatePlatform = [
  param('platform')
    .isIn(['android', 'ios'])
    .withMessage('Platform must be either android or ios'),
];

module.exports = {
  validateAppVersion,
  validateVersionCheck,
  validatePlatform,
};