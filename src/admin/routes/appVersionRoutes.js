const express = require('express');
const router = express.Router();

const {
  getAllAppVersions,
  getAppVersionByPlatform,
  upsertAppVersion,
  deleteAppVersion,
  checkVersionCompatibility,
  getAppVersionStats,
} = require('../controllers/adminAppVersionController');

const {
  validateAppVersion,
  validateVersionCheck,
  validatePlatform,
} = require('../validation/appVersionValidation');

const { adminAuth } = require('../middleware/adminAuthMiddleware');

// Apply admin authentication to all routes
router.use(adminAuth);

// App Version Management Routes

/**
 * @route   GET /api/admin/app-versions
 * @desc    Get all app versions
 * @access  Private (Admin only)
 */
router.get('/', getAllAppVersions);

/**
 * @route   GET /api/admin/app-versions/stats
 * @desc    Get app version statistics
 * @access  Private (Admin only)
 */
router.get('/stats', getAppVersionStats);

/**
 * @route   GET /api/admin/app-versions/:platform
 * @desc    Get app version by platform
 * @access  Private (Admin only)
 */
router.get('/:platform', validatePlatform, getAppVersionByPlatform);

/**
 * @route   POST /api/admin/app-versions
 * @desc    Create or update app version
 * @access  Private (Admin only)
 */
router.post('/', validateAppVersion, upsertAppVersion);

/**
 * @route   PUT /api/admin/app-versions
 * @desc    Create or update app version (alias for POST)
 * @access  Private (Admin only)
 */
router.put('/', validateAppVersion, upsertAppVersion);

/**
 * @route   DELETE /api/admin/app-versions/:platform
 * @desc    Delete app version configuration
 * @access  Private (Admin only)
 */
router.delete('/:platform', validatePlatform, deleteAppVersion);

/**
 * @route   POST /api/admin/app-versions/check-compatibility
 * @desc    Check app version compatibility (for mobile app use)
 * @access  Private (Admin only)
 */
router.post('/check-compatibility', validateVersionCheck, checkVersionCompatibility);

module.exports = router;