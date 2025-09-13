const express = require("express");
const {
  getUserTokenBalance,
  getTransactionHistory,
  getEarningOpportunities,
  getEarningMethods,
} = require("../controllers/coinController");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

// All coin routes require authentication
router.use(authenticateUser);

/**
 * @swagger
 * /api/coins/balance:
 *   get:
 *     summary: Get user's token balance and recent transactions
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User token balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentBalance:
 *                       type: number
 *                     totalEarned:
 *                       type: number
 *                     totalSpent:
 *                       type: number
 */
router.get("/balance", getUserTokenBalance);

/**
 * @swagger
 * /api/coins/transactions:
 *   get:
 *     summary: Get paginated transaction history
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [like, referral]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 */
router.get("/transactions", getTransactionHistory);

/**
 * @swagger
 * /api/coins/opportunities:
 *   get:
 *     summary: Get available earning opportunities
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earning opportunities retrieved successfully
 */
router.get("/opportunities", getEarningOpportunities);

/**
 * @swagger
 * /api/coins/earning-methods:
 *   get:
 *     summary: Get all earning methods from reward config
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earning methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     methods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           icon:
 *                             type: string
 *                           category:
 *                             type: string
 *                           status:
 *                             type: string
 *                           hasAction:
 *                             type: boolean
 */
router.get("/earning-methods", getEarningMethods);

module.exports = router;
