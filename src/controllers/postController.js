const { Post, User, Like, Comment, Follow, PostView } = require("../models");
const AppError = require("../errors/appError");
const path = require("path");
const fs = require("fs");
const { Types } = require("mongoose");

/**
 * Get all posts for the current user
 * @route GET /api/posts/me
 */
exports.getMyPosts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments({ userId });
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "fullName profileImage",
      });

    // Add like status for each post (check if current user liked their own posts)
    const postIds = posts.map((post) => post._id);
    const userLikes = await Like.find({ user: userId, post: { $in: postIds } });
    const likedPostIds = new Set(userLikes.map((like) => like.post.toString()));

    const postsWithLikeStatus = posts.map((post) => ({
      ...post.toObject(),
      isLiked: likedPostIds.has(post._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPosts / limit),
          totalResults: totalPosts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a post by ID
 * @route GET /api/posts/:id
 */
exports.getPostById = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id; // Get current user ID if authenticated

    const post = await Post.findById(postId).populate({
      path: "userId",
      select: "fullName profileImage",
    });
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check if the current user has liked the post
    let isLiked = false;
    if (userId) {
      const userLike = await Like.findOne({ post: postId, user: userId });
      isLiked = !!userLike;
    }

    // Add isLiked status to the response
    const postWithLikeStatus = {
      ...post.toObject(),
      isLiked,
    };

    res.status(200).json({
      message: "Post fetched successfully",
      post: postWithLikeStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new post
 * @route POST /api/posts
 */
exports.createPost = async (req, res, next) => {
  try {
    // Get user from authenticated middleware
    const userId = req.user._id;
    console.log("🚀 ~ userId:", userId);

    // Get content from validated request body
    const { content, mediaTypes } = req.body;
    console.log("🚀 ~ mediaTypes:", mediaTypes);
    console.log("🚀 ~ req.files:", req.files);

    // Process uploaded files robustly (handle single/multiple files)
    let mediaFiles = [];
    if (req.files && (req.files["mediaFiles"] || req.files["thumbnails"])) {
      let mediaArr = req.files["mediaFiles"] || [];
      let thumbArr = req.files["thumbnails"] || [];
      // If only one file, multer gives object not array
      if (!Array.isArray(mediaArr)) mediaArr = [mediaArr];
      if (!Array.isArray(thumbArr)) thumbArr = [thumbArr];

      // Check for thumbnail mapping information
      const thumbnailMapping = {};

      // Debug log all request body fields
      console.log("Request body fields:", Object.keys(req.body));
      console.log("Thumbnail files received:", thumbArr.length);

      // Process thumbnail mappings
      Object.keys(req.body).forEach((key) => {
        if (key.startsWith("thumbnail_for_video_")) {
          try {
            const videoIndex = parseInt(
              key.replace("thumbnail_for_video_", "")
            );
            const mapInfo = JSON.parse(req.body[key]);
            console.log(
              `Found mapping for video at index ${videoIndex}:`,
              mapInfo
            );
            // Store the mapping - index to thumbnail file
            if (thumbArr.length > 0) {
              thumbnailMapping[videoIndex] = thumbArr.shift(); // Get the next thumbnail in order
              console.log(`Associated thumbnail with video ${videoIndex}`);
            }
          } catch (err) {
            console.log("Error parsing thumbnail mapping:", err);
          }
        }
      });

      // Parse mediaTypes if sent as JSON string
      let parsedMediaTypes = mediaTypes;
      if (typeof mediaTypes === "string") {
        try {
          parsedMediaTypes = JSON.parse(mediaTypes);
          console.log("Parsed media types:", parsedMediaTypes);
        } catch (err) {
          console.log("Error parsing mediaTypes JSON:", err);
          parsedMediaTypes = mediaTypes.split(",");
        }
      }

      // Process all media files with their types and thumbnails
      mediaFiles = mediaArr.map((file, index) => {
        const relativePath = `/images/posts/${path.basename(file.path)}`;

        // Determine file type with multiple fallbacks
        let fileType;

        // 1. Use explicitly provided mediaTypes array
        if (
          parsedMediaTypes &&
          Array.isArray(parsedMediaTypes) &&
          parsedMediaTypes[index]
        ) {
          fileType = parsedMediaTypes[index];
        }
        // 2. Use mimetype
        else if (file.mimetype) {
          fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        }
        // 3. Use file extension as last resort
        else {
          const filename = file.originalname || path.basename(file.path);
          const isVideo = /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(filename);
          fileType = isVideo ? "video" : "image";
        }

        console.log(`File ${index}: Type determined as ${fileType}`);

        // Create media object
        const mediaObject = {
          url: relativePath,
          type: fileType,
        };

        // If it's a video, add thumbnail
        if (fileType === "video" || fileType.startsWith("video/")) {
          console.log(`Processing video at index ${index}`);

          // Check explicit mapping first (our new method)
          if (thumbnailMapping[index]) {
            console.log(`Using explicit thumbnail mapping for video ${index}`);
            mediaObject.thumbnail = `/images/posts/${path.basename(
              thumbnailMapping[index].path
            )}`;
            console.log(`Thumbnail path set: ${mediaObject.thumbnail}`);
          }
          // Fallback to old method
          else if (thumbArr.length > 0) {
            console.log(`Using fallback thumbnail for video ${index}`);
            // Use the next available thumbnail
            const thumbFile = thumbArr.shift();
            mediaObject.thumbnail = `/images/posts/${path.basename(
              thumbFile.path
            )}`;
            console.log(
              `Fallback thumbnail path set: ${mediaObject.thumbnail}`
            );
          } else {
            console.log(`No thumbnail available for video ${index}`);
          }
        }

        return mediaObject;
      });

      // Log the final media files array
      console.log(
        "Final mediaFiles array:",
        JSON.stringify(mediaFiles, null, 2)
      );
    }

    // Validate: either content or mediaFiles must be present
    if (!content && mediaFiles.length === 0) {
      return next(
        new AppError(
          "Post must contain either text content or media files",
          400
        )
      );
    }

    // Create new post
    const post = await Post.create({
      userId,
      content,
      mediaFiles,
    });

    // Populate user details
    const populatedPost = await Post.findById(post._id).populate({
      path: "userId",
      select: "fullName profileImage", // Only select the needed fields
    });

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    // If an error occurs, cleanup any uploaded files
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

/**
 * Get all posts with pagination
 * @route GET /api/posts
 */
exports.getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user?._id; // Get current user ID if authenticated

    // Get total count for pagination info
    const totalPosts = await Post.countDocuments();

    // Get posts with populated user info
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "fullName profileImage",
      });

    // If user is authenticated, check like status for each post
    let postsWithLikeStatus = posts;
    if (userId) {
      const postIds = posts.map((post) => post._id);
      const userLikes = await Like.find({
        user: userId,
        post: { $in: postIds },
      });
      const likedPostIds = new Set(
        userLikes.map((like) => like.post.toString())
      );

      postsWithLikeStatus = posts.map((post) => ({
        ...post.toObject(),
        isLiked: likedPostIds.has(post._id.toString()),
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPosts / limit),
          totalResults: totalPosts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Personalized feed (IG/FB-style) with PER-FACET SKIP and offsetted fallbacks
 * - Keeps follower/discovery mix per page (FOLLOWER_RATIO)
 * - Excludes viewed posts on ALL pages
 * - Uses denormalized likesCount/commentsCount on Post
 * - Per-facet $skip then $limit (no global skip after merge)
 * - Deterministic ordering (no $rand) → stable pagination
 * - Fallback #1 (viewed) and #2 (global) support offsets (f1Offset/f2Offset)
 * @route GET /api/posts/feed?limit=10&skip=20&f1Offset=0&f2Offset=0
 */
exports.getUserFeed = async (req, res, next) => {
  try {
    // ---- Params & tunables ----
    const userId = new Types.ObjectId(String(req.user._id));
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    // fresh pagination via per-facet skip
    const rawSkip = parseInt(req.query.skip);
    const skip = Number.isFinite(rawSkip) && rawSkip > 0 ? rawSkip : 0;

    // fallback offsets (continue across requests after fresh is exhausted)
    const f1Offset = Math.max(0, parseInt(req.query.f1Offset) || 0);
    console.log("🚀 ~ req.query:", req.query);
    const f2Offset = Math.max(0, parseInt(req.query.f2Offset) || 0);
    const FOLLOWER_RATIO = 0.5; // follower/discovery blend
    const WINDOW_DAYS = 14; // consider recent posts only
    const VIEWED_NIN_CAP = 2000; // cap exclusion list for $nin
    const windowStart = new Date(
      Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    // 1) Quotas per page (simplified: follower + global)
    const followerQuota = Math.ceil(limit * FOLLOWER_RATIO);
    const globalQuota = Math.max(0, limit - followerQuota);

    // 2) Per-facet skips (proportional to overall skip)
    const followerSkip = Math.ceil(skip * FOLLOWER_RATIO);
    const globalSkip = Math.max(0, skip - followerSkip);

    // ---- Parallel user context ----
    const [viewedRaw, follows] = await Promise.all([
      PostView.getUserViewedPosts(userId, 7), // array of Post _ids seen recently
      Follow.find({ follower: userId }).select("following"),
    ]);

    // ---- Cast ids to ObjectId ----
    const viewedPostIds = (viewedRaw || [])
      .map((id) => new Types.ObjectId(String(id)))
      .slice(0, VIEWED_NIN_CAP);

    const followingIds = (follows || []).map(
      (f) => new Types.ObjectId(String(f.following))
    );

    // ---- Index-friendly base filter (reused in facets) ----
    const baseMatch = {
      // createdAt: { $gte: windowStart },
      userId: { $ne: userId },
      _id: { $nin: viewedPostIds },
    };

    // ---- Faceted ranking: follower vs discovery (per-facet skip/limit) ----
    // NOTE: Do author $lookup AFTER sort/skip/limit to avoid work on dropped rows.
    const facetStage = {
      $facet: {
        follower: [
          { $match: { ...baseMatch, userId: { $in: followingIds } } },
          {
            $set: {
              likesCount: { $ifNull: ["$likesCount", 0] },
              commentsCount: { $ifNull: ["$commentsCount", 0] },
            },
          },
          {
            $addFields: {
              recencyScore: {
                $max: [
                  0,
                  {
                    $subtract: [
                      200,
                      {
                        $divide: [
                          { $subtract: [new Date(), "$createdAt"] },
                          3600000,
                        ],
                      },
                    ],
                  },
                ],
              },
              engagementScore: {
                $add: [
                  { $multiply: ["$likesCount", 3] },
                  { $multiply: ["$commentsCount", 5] },
                ],
              },
              finalScore: {
                $add: [2000, 500, "$recencyScore", "$engagementScore"],
              },
              isFollowerPost: true,
              isFresh: true,
            },
          },
          { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
          ...(followerSkip ? [{ $skip: followerSkip }] : []),
          { $limit: Math.max(0, followerQuota) },

          // Now enrich only the kept rows
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "author",
              pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
            },
          },
          {
            $set: {
              author: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] },
            },
          },

          {
            $lookup: {
              // tiny isLiked check (needs likes { post:1, user:1 } unique)
              from: "likes",
              let: { pid: "$_id", uid: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post", "$$pid"] },
                        { $eq: ["$user", "$$uid"] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: "userLike",
            },
          },
          {
            $project: {
              _id: 1,
              content: 1,
              mediaFiles: 1,
              createdAt: 1,
              updatedAt: 1,
              posterId: "$userId",
              author: 1,
              likesCount: 1,
              commentsCount: 1,
              isFollowerPost: 1,
              isFresh: 1,
              isLiked: { $gt: [{ $size: "$userLike" }, 0] },
            },
          },
        ],

        discovery: [
          { $match: { ...baseMatch, userId: { $nin: followingIds } } },
          {
            $set: {
              likesCount: { $ifNull: ["$likesCount", 0] },
              commentsCount: { $ifNull: ["$commentsCount", 0] },
            },
          },
          {
            $addFields: {
              recencyScore: {
                $max: [
                  0,
                  {
                    $subtract: [
                      200,
                      {
                        $divide: [
                          { $subtract: [new Date(), "$createdAt"] },
                          3600000,
                        ],
                      },
                    ],
                  },
                ],
              },
              engagementScore: {
                $add: [
                  { $multiply: ["$likesCount", 3] },
                  { $multiply: ["$commentsCount", 5] },
                ],
              },
              // deterministic "random" (stable across requests) - safe ObjectId conversion
              randomScore: {
                $mod: [
                  {
                    $convert: {
                      input: "$_id",
                      to: "long",
                      onError: 0,
                    },
                  },
                  300,
                ],
              },
              finalScore: {
                $add: [
                  200,
                  "$recencyScore",
                  "$engagementScore",
                  "$randomScore",
                ],
              },
              isFollowerPost: false,
              isFresh: true,
            },
          },
          { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
          ...(discoverySkip ? [{ $skip: discoverySkip }] : []),
          { $limit: Math.max(0, discoveryQuota + 1) },

          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "author",
              pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
            },
          },
          {
            $set: {
              author: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] },
            },
          },

          {
            $lookup: {
              from: "likes",
              let: { pid: "$_id", uid: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post", "$$pid"] },
                        { $eq: ["$user", "$$uid"] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: "userLike",
            },
          },
          {
            $project: {
              _id: 1,
              content: 1,
              mediaFiles: 1,
              createdAt: 1,
              updatedAt: 1,
              posterId: "$userId",
              author: 1,
              likesCount: 1,
              commentsCount: 1,
              isFollowerPost: 1,
              isFresh: 1,
              isLiked: { $gt: [{ $size: "$userLike" }, 0] },
            },
          },
        ],
      },
    };

    // ---- Merge follower+discovery (keep follower-first ordering) ----
    const mergeAndTrim = [
      {
        $project: { combined: { $concatArrays: ["$follower", "$discovery"] } },
      },
      { $unwind: "$combined" },
      { $replaceRoot: { newRoot: "$combined" } },
      // final tie-breaker (both facets already sorted)
      { $sort: { isFollowerPost: -1, createdAt: -1, _id: -1 } },
      { $limit: limit },
    ];

    const freshPosts = await Post.aggregate(
      [{ $match: baseMatch }, facetStage, ...mergeAndTrim],
      { allowDiskUse: true }
    );

    let finalPosts = freshPosts;

    // For fallbacks, exclude already chosen fresh IDs
    const excludeIdsSet = new Set(finalPosts.map((p) => String(p._id)));
    console.log("🚀 ~ finalPosts: before fallback 1", finalPosts.length);
    // ---------------- Fallback #1: global (still short) ----------------
    let globalFallback = [];
    if (finalPosts.length < limit) {
      const need = limit - finalPosts.length;

      // Properly convert all existing post IDs to ObjectId for exclusion
      const allExistingIds = [
        ...Array.from(excludeIdsSet).map((id) => new Types.ObjectId(id)),
        ...viewedPostIds,
      ];

      // Debug: Check how many posts exist that could be returned
      // const potentialPostsCount = await Post.countDocuments({
      //   userId: { $ne: userId },
      //   // createdAt: { $gte: windowStart },
      //   _id: { $nin: allExistingIds },
      // });
      // console.log(
      //   "🚀 ~ potentialPostsCount for global fallback:",
      //   potentialPostsCount
      // );

      globalFallback = await Post.aggregate(
        [
          {
            $match: {
              userId: { $ne: userId },
              // createdAt: { $gte: windowStart },
              _id: {
                $nin: allExistingIds,
              },
            },
          },
          {
            $set: {
              likesCount: { $ifNull: ["$likesCount", 0] },
              commentsCount: { $ifNull: ["$commentsCount", 0] },
            },
          },
          // Deterministic ranking for cold-start fill
          {
            $addFields: {
              popScore: {
                $add: ["$likesCount", { $multiply: ["$commentsCount", 2] }],
              },
              ageHrs: {
                $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000],
              },
              jitter: {
                $mod: [
                  {
                    $convert: {
                      input: "$_id",
                      to: "long",
                      onError: 0,
                    },
                  },
                  25,
                ],
              },
              finalScore: {
                $add: [
                  { $min: ["$popScore", 150] },
                  { $subtract: [100, { $min: [{ $floor: "$ageHrs" }, 100] }] },
                  "$jitter",
                ],
              },
              isFollowerPost: { $in: ["$userId", followingIds] },
              isFresh: true,
            },
          },
          { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
          ...(f2Offset ? [{ $skip: f2Offset }] : []),
          { $limit: need },

          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "author",
              pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
            },
          },
          {
            $set: {
              author: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] },
            },
          },
          {
            $lookup: {
              from: "likes",
              let: { pid: "$_id", uid: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post", "$$pid"] },
                        { $eq: ["$user", "$$uid"] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: "userLike",
            },
          },
          {
            $project: {
              _id: 1,
              content: 1,
              mediaFiles: 1,
              createdAt: 1,
              updatedAt: 1,
              posterId: "$userId",
              author: 1,
              likesCount: 1,
              commentsCount: 1,
              isFollowerPost: 1,
              isFresh: 1,
              isLiked: { $gt: [{ $size: "$userLike" }, 0] },
            },
          },
        ],
        { allowDiskUse: true }
      );

      finalPosts = [...finalPosts, ...globalFallback];

      globalFallback = globalFallback || [];
    }

    console.log("🚀 ~ finalPosts: before fallback 2", finalPosts.length);
    // ---------------- Fallback #2: previously viewed (not fresh) ----------------
    let viewedFallback = [];
    if (finalPosts.length < limit && viewedPostIds.length > 0) {
      const need = limit - finalPosts.length;

      // Exclude posts already in finalPosts from the viewed fallback
      const excludeAlreadyIds = finalPosts.map(
        (p) => new Types.ObjectId(String(p._id))
      );

      viewedFallback = await Post.aggregate(
        [
          {
            $match: {
              userId: { $ne: userId },
              _id: {
                $in: viewedPostIds,
                $nin: excludeAlreadyIds,
              },
              createdAt: { $gte: windowStart },
            },
          },
          {
            $set: {
              likesCount: { $ifNull: ["$likesCount", 0] },
              commentsCount: { $ifNull: ["$commentsCount", 0] },
            },
          },
          // Deterministic order (popularity + light age decay + jitter)
          {
            $addFields: {
              popScore: {
                $add: ["$likesCount", { $multiply: ["$commentsCount", 2] }],
              },
              ageHrs: {
                $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000],
              },
              jitter: {
                $mod: [
                  {
                    $convert: {
                      input: "$_id",
                      to: "long",
                      onError: 0,
                    },
                  },
                  50,
                ],
              },
              finalScore: {
                $add: [
                  "$popScore",
                  { $subtract: [100, { $min: [{ $floor: "$ageHrs" }, 100] }] },
                  "$jitter",
                ],
              },
              isFollowerPost: { $in: ["$userId", followingIds] },
              isFresh: false,
            },
          },
          { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
          ...(f1Offset ? [{ $skip: f1Offset }] : []),
          { $limit: need },

          // Light author + isLiked only for returned rows
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "author",
              pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
            },
          },
          {
            $set: {
              author: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] },
            },
          },
          {
            $lookup: {
              from: "likes",
              let: { pid: "$_id", uid: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post", "$$pid"] },
                        { $eq: ["$user", "$$uid"] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: "userLike",
            },
          },
          {
            $project: {
              _id: 1,
              content: 1,
              mediaFiles: 1,
              createdAt: 1,
              updatedAt: 1,
              posterId: "$userId",
              author: 1,
              likesCount: 1,
              commentsCount: 1,
              isFollowerPost: 1,
              isFresh: 1,
              isLiked: { $gt: [{ $size: "$userLike" }, 0] },
            },
          },
        ],
        { allowDiskUse: true }
      );

      finalPosts = [...finalPosts, ...viewedFallback];
      viewedFallback = viewedFallback || [];
    }

    console.log("🚀 ~ finalPosts:", finalPosts.length);
    console.log(
      "🚀 ~ finalPosts IDs:",
      finalPosts.map((po) => po._id.toString())
    );

    // ✅ OPTION A: Track actual fresh posts consumed for accurate pagination
    const freshPostsConsumed = freshPosts.length;
    console.log("🚀 ~ freshPostsConsumed:", freshPostsConsumed);

    // ---- Response ----
    res.status(200).json({
      success: true,
      data: {
        posts: finalPosts.slice(0, limit),
        pagination: {
          page: 1, // nominal; using skip + offsets
          limit,
          skip,
          hasNextPage: finalPosts.length === limit,
          hasPrevPage: skip > 0,
          // ✅ NEW: Return actual fresh posts consumed for accurate skip increment
          freshPostsConsumed,
          // return how many we provided from each pool so the client can update offsets
          f1Returned: (viewedFallback || []).length,
          f2Returned: (globalFallback || []).length,
        },
      },
    });
  } catch (error) {
    console.error("🚨 Feed generation error:", error);
    next(error);
  }
};

/**
 * Mark posts as viewed (for tracking what user has seen)
 * @route POST /api/posts/mark-viewed
 */
exports.markPostsAsViewed = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { postIds } = req.body; // ✅ SIMPLIFIED: Only require postIds for initial stage
    console.log("🚀 ~ postIds: viewd", postIds);

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return next(new AppError("Post IDs are required", 400));
    }

    const results = [];

    // Mark each post as viewed
    for (const postId of postIds) {
      try {
        // ✅ SIMPLIFIED: Just mark as viewed without complex analytics for initial stage
        const viewRecord = await PostView.markAsViewed(userId, postId);
        results.push({
          postId,
          success: true,
          viewRecord: viewRecord._id,
        });
      } catch (error) {
        console.error(`Error marking post ${postId} as viewed:`, error);
        results.push({
          postId,
          success: false,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Posts marked as viewed",
      data: {
        results,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's view history (for analytics/debugging)
 * @route GET /api/posts/view-history
 */
exports.getUserViewHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalViews = await PostView.countDocuments({ user: userId });
    const viewHistory = await PostView.find({ user: userId })
      .sort({ viewedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "post",
        select: "content mediaFiles createdAt",
        populate: {
          path: "userId",
          select: "fullName profileImage",
        },
      })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        viewHistory,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalViews / limit),
          totalResults: totalViews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a post
 * @route PUT /api/posts/:id
 */
exports.updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    // Debug the full request body structure
    console.log("🚀 ~ Raw req.body:", req.body);
    console.log("🚀 ~ req.body keys:", Object.keys(req.body));
    console.log("🚀 ~ req.files:", req.files);
    console.log(
      "🚀 ~ req.files keys:",
      req.files ? Object.keys(req.files) : "No files"
    );

    let { content, mediaTypes, existingMediaFiles } = req.body;
    console.log("🚀 ~ content:", content);
    console.log("🚀 ~ mediaTypes:", mediaTypes);
    console.log("🚀 ~ existingMediaFiles:", existingMediaFiles);
    const userId = req.user._id;

    // Handle case where req.body is a string (content-only update)
    if (typeof req.body === "string") {
      content = req.body;
      mediaTypes = undefined;
      existingMediaFiles = undefined;
    }

    console.log("🚀 ~ Update post request:", {
      postId,
      content,
      contentType: typeof content,
      mediaTypes,
      existingMediaFiles,
      hasFiles: !!req.files,
      filesCount: req.files ? Object.keys(req.files).length : 0,
      bodyType: typeof req.body,
    });

    // Find post and check ownership
    const post = await Post.findById(postId);

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check if current user is the post creator
    if (post.userId.toString() !== userId.toString()) {
      return next(
        new AppError("Unauthorized: You can only update your own posts", 403)
      );
    }

    // Handle media files update
    let finalMediaFiles = [];
    let filesToDelete = [];

    // Parse existing media files that should be kept
    let existingToKeep = [];
    if (existingMediaFiles) {
      try {
        existingToKeep = JSON.parse(existingMediaFiles);
        console.log("🔍 Existing media files to keep:", existingToKeep);
      } catch (err) {
        console.log("Error parsing existingMediaFiles:", err);
      }
    }

    console.log("🔍 Original post media files:", post.mediaFiles);

    // Determine which old files should be deleted
    if (post.mediaFiles && post.mediaFiles.length > 0) {
      post.mediaFiles.forEach((mediaFile) => {
        let mediaPath;
        if (typeof mediaFile === "string") {
          mediaPath = mediaFile;
        } else if (mediaFile.url) {
          mediaPath = mediaFile.url;
        }

        console.log("🔍 Checking media file:", { mediaFile, mediaPath });

        // Check if this file should be kept
        const shouldKeep = existingToKeep.some((existing) => {
          const match1 = existing.url === mediaPath;
          const match2 = existing.url === mediaFile.url;
          console.log("🔍 Comparing:", {
            existingUrl: existing.url,
            mediaPath,
            mediaFileUrl: mediaFile.url,
            match1,
            match2,
          });
          return match1 || match2;
        });

        console.log("🔍 Should keep file:", shouldKeep);

        if (!shouldKeep && mediaPath) {
          // Mark for deletion
          console.log("🔍 Marking for deletion:", mediaPath);
          filesToDelete.push(mediaFile);
        } else {
          console.log("🔍 Keeping file:", mediaPath);
        }
      });
    }

    // Delete files that are no longer needed
    filesToDelete.forEach((mediaFile) => {
      let mediaPath;
      if (typeof mediaFile === "string") {
        mediaPath = mediaFile;
      } else if (mediaFile.url) {
        mediaPath = mediaFile.url;
      }

      if (mediaPath) {
        const filePath = path.join(
          __dirname,
          "../../",
          mediaPath.replace(/^\//, "")
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted old media file:", filePath);
        }
      }

      // Also clean up thumbnail if it exists
      if (mediaFile.thumbnail) {
        const thumbPath = path.join(
          __dirname,
          "../../",
          mediaFile.thumbnail.replace(/^\//, "")
        );
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          console.log("Deleted old thumbnail:", thumbPath);
        }
      }
    });

    // Add existing files that should be kept - normalize the type field
    finalMediaFiles = existingToKeep.map((file) => ({
      ...file,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type, // fallback to original if already normalized
    }));

    console.log(
      "🔍 Files to delete:",
      filesToDelete.map((f) => f.url || f)
    );
    console.log(
      "🔍 Final media files before adding new ones:",
      finalMediaFiles
    );

    // Process new uploaded files if any
    if (req.files && req.files["mediaFiles"]) {
      let mediaArr = req.files["mediaFiles"] || [];
      let thumbArr = req.files["thumbnails"] || [];

      if (!Array.isArray(mediaArr)) mediaArr = [mediaArr];
      if (!Array.isArray(thumbArr)) thumbArr = [thumbArr];

      const thumbnailMapping = {};

      // Process thumbnail mappings
      Object.keys(req.body).forEach((key) => {
        if (key.startsWith("thumbnail_for_video_")) {
          try {
            const videoIndex = parseInt(
              key.replace("thumbnail_for_video_", "")
            );
            const mapInfo = JSON.parse(req.body[key]);
            console.log(
              `Found mapping for video at index ${videoIndex}:`,
              mapInfo
            );
            if (thumbArr.length > 0) {
              thumbnailMapping[videoIndex] = thumbArr.shift();
              console.log(`Associated thumbnail with video ${videoIndex}`);
            }
          } catch (err) {
            console.log("Error parsing thumbnail mapping:", err);
          }
        }
      });

      // Parse mediaTypes
      let parsedMediaTypes = mediaTypes;
      if (typeof mediaTypes === "string") {
        try {
          parsedMediaTypes = JSON.parse(mediaTypes);
        } catch (err) {
          parsedMediaTypes = mediaTypes.split(",");
        }
      }

      // Process new media files
      const newMediaFiles = mediaArr.map((file, index) => {
        const relativePath = `/images/posts/${path.basename(file.path)}`;

        let fileType;
        if (
          parsedMediaTypes &&
          Array.isArray(parsedMediaTypes) &&
          parsedMediaTypes[index]
        ) {
          fileType = parsedMediaTypes[index];
        } else if (file.mimetype) {
          fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        } else {
          const filename = file.originalname || path.basename(file.path);
          const isVideo = /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(filename);
          fileType = isVideo ? "video" : "image";
        }

        const mediaObject = {
          url: relativePath,
          type: fileType,
        };

        // Add thumbnail for videos
        if (fileType === "video" || fileType.startsWith("video/")) {
          if (thumbnailMapping[index]) {
            mediaObject.thumbnail = `/images/posts/${path.basename(
              thumbnailMapping[index].path
            )}`;
          } else if (thumbArr.length > 0) {
            const thumbFile = thumbArr.shift();
            mediaObject.thumbnail = `/images/posts/${path.basename(
              thumbFile.path
            )}`;
          }
        }

        return mediaObject;
      });

      // Add new media files to the final list
      finalMediaFiles = [...finalMediaFiles, ...newMediaFiles];
    }

    // Update media files
    post.mediaFiles = finalMediaFiles;

    console.log("🔍 Final media files set on post:", post.mediaFiles);

    // Update post content and timestamp
    // Ensure content is properly handled
    if (content !== undefined && content !== null) {
      post.content = content.toString();
    }

    // Validate that the post still meets requirements after update
    if (
      (!post.content || post.content.trim() === "") &&
      (!post.mediaFiles || post.mediaFiles.length === 0)
    ) {
      return next(
        new AppError("Post must have either text content or media files", 400)
      );
    }

    post.updatedAt = Date.now();
    await post.save();

    // Populate user details for response
    const updatedPost = await Post.findById(post._id).populate({
      path: "userId",
      select: "fullName profileImage",
    });

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    // Cleanup uploaded files on error
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
    }
    next(error);
  }
};

/**
 * Delete a post
 * @route DELETE /api/posts/:id
 */
exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Find post and check ownership
    const post = await Post.findById(postId);

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check if current user is the post creator
    if (post.userId.toString() !== userId.toString()) {
      return next(
        new AppError("Unauthorized: You can only delete your own posts", 403)
      );
    }

    // Delete media files associated with the post
    if (post.mediaFiles && post.mediaFiles.length > 0) {
      post.mediaFiles.forEach((mediaFile) => {
        let mediaPath;
        if (typeof mediaFile === "string") {
          // Legacy string format
          mediaPath = mediaFile;
        } else if (mediaFile.url) {
          // New object format
          mediaPath = mediaFile.url;
        }

        if (mediaPath) {
          const filePath = path.join(
            __dirname,
            "../../",
            mediaPath.replace(/^\//, "")
          );
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Deleted media file:", filePath);
          }

          // Also delete thumbnail if it exists
          if (mediaFile.thumbnail) {
            const thumbPath = path.join(
              __dirname,
              "../../",
              mediaFile.thumbnail.replace(/^\//, "")
            );
            if (fs.existsSync(thumbPath)) {
              fs.unlinkSync(thumbPath);
              console.log("Deleted thumbnail:", thumbPath);
            }
          }
        }
      });
    }

    // Delete the post
    await Post.deleteOne({ _id: postId });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update likes and comments counts for all posts (admin only)
 * @route POST /api/posts/update-counts
 */
exports.updatePostCounts = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return next(new AppError("Not authorized", 403));
    }

    // Get all posts
    const posts = await Post.find();

    // Process each post
    const results = await Promise.all(
      posts.map(async (post) => {
        // Count likes
        const likesCount = await Like.countDocuments({ post: post._id });

        // Count top-level comments
        const commentsCount = await Comment.countDocuments({
          post: post._id,
          isReply: false,
        });

        // Update post with counts
        await Post.findByIdAndUpdate(post._id, {
          likesCount,
          commentsCount,
        });

        return {
          postId: post._id,
          likesCount,
          commentsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "All post counts updated successfully",
      data: {
        postsUpdated: results.length,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get interaction counts for a post
 * @route GET /api/posts/:id/counts
 */
exports.getPostCounts = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id;

    // Find the post with just the count fields
    const post = await Post.findById(postId, "likesCount commentsCount");

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // Check if the current user has liked the post
    let isLiked = false;
    if (userId) {
      const userLike = await Like.findOne({ post: postId, user: userId });
      isLiked = !!userLike;
    }

    res.status(200).json({
      success: true,
      message: "Post counts fetched successfully",
      data: {
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        isLiked,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts by user ID
 * @route GET /api/posts/user/:id
 */
exports.getUserPosts = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user?._id; // Current logged-in user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const totalPosts = await Post.countDocuments({ userId });
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "fullName profileImage",
      });

    // Add like status for each post if current user is authenticated
    let postsWithLikeStatus = posts;
    if (currentUserId) {
      const postIds = posts.map((post) => post._id);
      const userLikes = await Like.find({
        user: currentUserId,
        post: { $in: postIds },
      });
      const likedPostIds = new Set(
        userLikes.map((like) => like.post.toString())
      );

      postsWithLikeStatus = posts.map((post) => ({
        ...post.toObject(),
        isLiked: likedPostIds.has(post._id.toString()),
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPosts / limit),
          totalResults: totalPosts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
