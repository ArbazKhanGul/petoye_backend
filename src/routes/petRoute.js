const express = require("express");
const validate = require("../middleware/validateMiddleware");
const { petListingSchema } = require("../validation/petValidation");
const petController = require("../controllers/petController");

const upload = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/pets:
 *   post:
 *     summary: Create a new pet listing
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PetListing'
 *     responses:
 *       201:
 *         description: Pet listing created successfully
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         description: Unauthorized, authentication required
 *       500:
 *         description: Server error
 */

router
  .route("/")
  .post(
    authMiddleware,
    upload.fields([
      { name: "mediaFiles", maxCount: 3 },
      { name: "thumbnails", maxCount: 3 },
    ]),
    validate(petListingSchema),
    petController.createPetListing
  )
  .get(petController.getAllPetListings);

/**
 * @swagger
 * /api/pets/me:
 *   get:
 *     summary: Get current user's pet listings
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's pet listings
 *       401:
 *         description: Unauthorized, authentication required
 */
router.route("/me").get(authMiddleware, petController.getMyPetListings);

/**
 * @swagger
 * /api/pets/feed:
 *   get:
 *     summary: Get personalized pet feed with filters
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of pet listings per page
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of listings to skip
 *       - in: query
 *         name: f1Offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Fallback 1 offset (viewed listings)
 *       - in: query
 *         name: f2Offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Fallback 2 offset (global listings)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by pet type (e.g., dog, cat, bird)
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Filter by gender
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (regex search)
 *       - in: query
 *         name: age
 *         schema:
 *           type: number
 *         description: Exact age filter
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: number
 *         description: Minimum age filter
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: number
 *         description: Maximum age filter
 *       - in: query
 *         name: weight
 *         schema:
 *           type: string
 *         description: Weight filter
 *       - in: query
 *         name: isVaccinated
 *         schema:
 *           type: boolean
 *         description: Filter by vaccination status
 *       - in: query
 *         name: personalityTraits
 *         schema:
 *           type: string
 *         description: Filter by personality traits (comma-separated)
 *       - in: query
 *         name: favoriteActivities
 *         schema:
 *           type: string
 *         description: Filter by favorite activities (comma-separated)
 *     responses:
 *       200:
 *         description: Personalized pet feed fetched successfully with filters applied
 *       401:
 *         description: Unauthorized, authentication required
 */
router.route("/feed").get(authMiddleware, petController.getPetFeed);

/**
 * @swagger
 * /api/pets/mark-viewed:
 *   post:
 *     summary: Mark pet listings as viewed
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               petListingIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of pet listing IDs to mark as viewed
 *     responses:
 *       200:
 *         description: Pet listings marked as viewed successfully
 *       400:
 *         description: Bad request, invalid input
 *       401:
 *         description: Unauthorized, authentication required
 */
router
  .route("/mark-viewed")
  .post(authMiddleware, petController.markPetListingsAsViewed);

/**
 * @swagger
 * /api/pets/view-history:
 *   get:
 *     summary: Get user's pet view history
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: View history fetched successfully
 *       401:
 *         description: Unauthorized, authentication required
 */
router
  .route("/view-history")
  .get(authMiddleware, petController.getUserPetViewHistory);

/**
 * @swagger
 * /api/pets/user/{id}:
 *   get:
 *     summary: Get pet listings by user ID
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User's pet listings fetched successfully
 *       404:
 *         description: User not found
 */
router.route("/user/:id").get(authMiddleware, petController.getUserPetListings);

/**
 * @swagger
 * /api/pets/{id}:
 *   get:
 *     summary: Get a single pet listing
 *     tags: [Pets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet listing ID
 *     responses:
 *       200:
 *         description: Pet listing details
 *       404:
 *         description: Pet listing not found
 *   put:
 *     summary: Update a pet listing
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PetListing'
 *     responses:
 *       200:
 *         description: Pet listing updated successfully
 *       401:
 *         description: Unauthorized, authentication required
 *       403:
 *         description: Forbidden, not the owner
 *       404:
 *         description: Pet listing not found
 *   delete:
 *     summary: Delete a pet listing
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet listing ID
 *     responses:
 *       200:
 *         description: Pet listing deleted successfully
 *       401:
 *         description: Unauthorized, authentication required
 *       403:
 *         description: Forbidden, not the owner
 *       404:
 *         description: Pet listing not found
 */
router
  .route("/:id")
  .get(petController.getPetListing)
  .put(
    authMiddleware,
    upload.fields([
      { name: "mediaFiles", maxCount: 3 },
      { name: "thumbnails", maxCount: 3 },
    ]),
    validate(petListingSchema),
    petController.updatePetListing
  )
  .delete(authMiddleware, petController.deletePetListing);

/**
 * @swagger
 * /api/pets/{id}/sold:
 *   patch:
 *     summary: Mark a pet as sold
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet listing ID
 *     responses:
 *       200:
 *         description: Pet marked as sold successfully
 *       401:
 *         description: Unauthorized, authentication required
 *       403:
 *         description: Forbidden, not the owner
 *       404:
 *         description: Pet listing not found
 */
router.route("/:id/sold").patch(authMiddleware, petController.markAsSold);

module.exports = router;
