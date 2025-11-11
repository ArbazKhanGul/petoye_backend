const express = require('express');
const router = express.Router();

const {
  // Competition management
  getAllCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  
  // Competition entries management
  getAllCompetitionEntries,
  getCompetitionEntryById,
  deleteCompetitionEntry,
  
  // Competition votes management
  getAllCompetitionVotes,
  flagVoteForReview,
  deleteCompetitionVote,
  
  // App version management
  getAllAppVersions,
  getAppVersionByPlatform,
  upsertAppVersion,
  deleteAppVersion
} = require('../controllers/adminCompetitionController');

const {
  validateCreateCompetition,
  validateUpdateCompetition,
  validateFlagVote,
  validateUpsertAppVersion
} = require('../validation/competitionValidation');

const { adminAuth } = require('../middleware/adminAuthMiddleware');

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * COMPETITION ROUTES
 */

// GET /admin/competitions - Get all competitions with filters and pagination
router.get('/competitions', getAllCompetitions);

// GET /admin/competitions/:id - Get competition by ID with detailed info
router.get('/competitions/:id', getCompetitionById);

// POST /admin/competitions - Create new competition
router.post('/competitions', validateCreateCompetition, createCompetition);

// PUT /admin/competitions/:id - Update competition
router.put('/competitions/:id', validateUpdateCompetition, updateCompetition);

// DELETE /admin/competitions/:id - Delete competition (only if no entries)
router.delete('/competitions/:id', deleteCompetition);

/**
 * COMPETITION ENTRIES ROUTES
 */

// GET /admin/competition-entries - Get all competition entries with filters
router.get('/competition-entries', getAllCompetitionEntries);

// GET /admin/competition-entries/:id - Get competition entry by ID with votes
router.get('/competition-entries/:id', getCompetitionEntryById);

// DELETE /admin/competition-entries/:id - Delete competition entry
router.delete('/competition-entries/:id', deleteCompetitionEntry);

/**
 * COMPETITION VOTES ROUTES
 */

// GET /admin/competition-votes - Get all competition votes with filters
router.get('/competition-votes', getAllCompetitionVotes);

// PATCH /admin/competition-votes/:id/flag - Flag/unflag vote for review
router.patch('/competition-votes/:id/flag', validateFlagVote, flagVoteForReview);

// DELETE /admin/competition-votes/:id - Delete fraudulent vote
router.delete('/competition-votes/:id', deleteCompetitionVote);

/**
 * APP VERSION ROUTES
 */

// GET /admin/app-versions - Get all app versions
router.get('/app-versions', getAllAppVersions);

// GET /admin/app-versions/:platform - Get app version by platform
router.get('/app-versions/:platform', getAppVersionByPlatform);

// PUT /admin/app-versions - Create or update app version
router.put('/app-versions', validateUpsertAppVersion, upsertAppVersion);

// DELETE /admin/app-versions/:id - Delete app version
router.delete('/app-versions/:id', deleteAppVersion);

module.exports = router;