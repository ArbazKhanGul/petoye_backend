const { body, param, query } = require('express-validator');

/**
 * COMPETITION VALIDATION
 */

const validateCreateCompetition = [
  body('date')
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const competitionDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (competitionDate < today) {
        throw new Error('Competition date cannot be in the past');
      }
      return true;
    }),

  body('entryFee')
    .isInt({ min: 1 })
    .withMessage('Entry fee must be a positive integer'),

  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 datetime'),

  body('endTime')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 datetime')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('entryStartTime')
    .isISO8601()
    .withMessage('Entry start time must be a valid ISO 8601 datetime')
    .custom((value, { req }) => {
      if (new Date(value) >= new Date(req.body.startTime)) {
        throw new Error('Entry start time must be before competition start time');
      }
      return true;
    }),

  body('entryEndTime')
    .isISO8601()
    .withMessage('Entry end time must be a valid ISO 8601 datetime')
    .custom((value, { req }) => {
      const entryEndTime = new Date(value);
      const entryStartTime = new Date(req.body.entryStartTime);
      const competitionStartTime = new Date(req.body.startTime);
      
      if (entryEndTime <= entryStartTime) {
        throw new Error('Entry end time must be after entry start time');
      }
      
      if (entryEndTime > competitionStartTime) {
        throw new Error('Entry end time must be before competition start time');
      }
      
      return true;
    }),
];

const validateUpdateCompetition = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD format'),

  body('entryFee')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Entry fee must be a positive integer'),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 datetime'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 datetime'),

  body('entryStartTime')
    .optional()
    .isISO8601()
    .withMessage('Entry start time must be a valid ISO 8601 datetime'),

  body('entryEndTime')
    .optional()
    .isISO8601()
    .withMessage('Entry end time must be a valid ISO 8601 datetime'),

  body('status')
    .optional()
    .isIn(['upcoming', 'active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: upcoming, active, completed, cancelled'),

  body('prizePool')
    .optional()
    .isNumeric()
    .withMessage('Prize pool must be a number'),

  body('totalEntries')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total entries must be a non-negative integer'),

  body('totalVotes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total votes must be a non-negative integer'),
];

/**
 * COMPETITION ENTRY VALIDATION
 */

const validateCompetitionEntryFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('competitionId')
    .optional()
    .isMongoId()
    .withMessage('Competition ID must be a valid MongoDB ObjectId'),

  query('status')
    .optional()
    .isIn(['active', 'cancelled'])
    .withMessage('Status must be either active or cancelled'),

  query('sortBy')
    .optional()
    .isIn(['votesCount', 'createdAt', 'petName', 'entryFeePaid'])
    .withMessage('Sort by must be one of: votesCount, createdAt, petName, entryFeePaid'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

/**
 * COMPETITION VOTE VALIDATION
 */

const validateCompetitionVoteFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('competitionId')
    .optional()
    .isMongoId()
    .withMessage('Competition ID must be a valid MongoDB ObjectId'),

  query('entryId')
    .optional()
    .isMongoId()
    .withMessage('Entry ID must be a valid MongoDB ObjectId'),

  query('flaggedOnly')
    .optional()
    .isBoolean()
    .withMessage('Flagged only must be a boolean'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'userId', 'entryId'])
    .withMessage('Sort by must be one of: createdAt, userId, entryId'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

const validateFlagVote = [
  body('flagged')
    .isBoolean()
    .withMessage('Flagged must be a boolean value'),

  body('reason')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Reason must be a string between 1 and 200 characters'),
];

/**
 * APP VERSION VALIDATION
 */

const validateUpsertAppVersion = [
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
 * MONGODB ID VALIDATION
 */

const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];

const validatePlatform = [
  param('platform')
    .isIn(['android', 'ios'])
    .withMessage('Platform must be either android or ios'),
];

module.exports = {
  // Competition validation
  validateCreateCompetition,
  validateUpdateCompetition,
  
  // Competition entry validation
  validateCompetitionEntryFilters,
  
  // Competition vote validation
  validateCompetitionVoteFilters,
  validateFlagVote,
  
  // App version validation
  validateUpsertAppVersion,
  
  // Common validation
  validateMongoId,
  validatePlatform
};