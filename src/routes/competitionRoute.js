const express = require("express");
const router = express.Router();
const competitionController = require("../controllers/competitionController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");
const upload = require("../middleware/multer");
const { voteSchema } = require("../validation/competitionValidation");

// Public routes (no auth required)
router.get("/", authMiddleware, competitionController.getCompetitionsByStatus); // New endpoint for filtered competitions
router.get(
  "/current",
  authMiddleware,
  competitionController.getCurrentCompetitions
);
router.get(
  "/previous-winners",
  authMiddleware,
  competitionController.getPreviousWinners
);
router.get("/past", authMiddleware, competitionController.getPastCompetitions);
router.get(
  "/:competitionId",
  authMiddleware,
  competitionController.getCompetitionDetails
);
router.get(
  "/:competitionId/leaderboard",
  authMiddleware,
  competitionController.getLeaderboard
);
router.get(
  "/:competitionId/entries/:entryId",
  authMiddleware,
  competitionController.getEntryDetails
);

// Protected routes (auth required)
router.post(
  "/:competitionId/entry",
  authMiddleware,
  upload.single("photo"),
  competitionController.submitEntry
);

router.delete(
  "/:competitionId/entry/:entryId",
  authMiddleware,
  competitionController.cancelEntry
);

router.post(
  "/:competitionId/vote/:entryId",
  authMiddleware,
  validateMiddleware(voteSchema),
  competitionController.voteForEntry
);

router.get(
  "/:competitionId/my-entry",
  authMiddleware,
  competitionController.getMyEntry
);

module.exports = router;
