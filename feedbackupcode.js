/**
 * Get personalized feed for the user - follower posts first, then random posts
 * Excludes already viewed posts to show fresh content like Facebook/Instagram
 *
 * ⚠️  IMPORTANT: Instagram/Facebook approach!
 * - ALL pages exclude viewed posts (not just page 1)
 * - Users never see same posts twice in a session
 * - Pagination works by excluding viewed content, not traditional skip
 * - This ensures infinite fresh content experience
 *
 * FINAL PRODUCTION-READY OPTIMIZED VERSION
 * @route GET /api/posts/feed
 */
// exports.getUserFeed = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     // 🎯 Instagram/Facebook approach: ALWAYS exclude viewed posts
//     // Pagination happens naturally through view exclusion

//     // OPTION 1: Hybrid approach - Best balance of performance and reliability
//     // Get user context data with parallel queries (most reliable)
//     const [viewedPostIds, followingIds] = await Promise.all([
//       PostView.getUserViewedPosts(userId, 7),
//       Follow.find({ follower: userId })
//         .select("following")
//         .then((follows) => follows.map((f) => f.following)),
//     ]);

//     console.log(
//       `🔍 User ${userId}: viewed ${viewedPostIds.length} posts (7 days), following ${followingIds.length} users`
//     );

//     // Single optimized aggregation pipeline for posts
//     const feedPipeline = [
//       // Stage 1: ALWAYS exclude viewed posts (Instagram/Facebook approach)
//       {
//         $match: {
//           userId: { $ne: userId }, // Exclude own posts
//           _id: { $nin: viewedPostIds }, // ALWAYS exclude viewed posts on ALL pages
//         },
//       },

//       // Stage 2: Add engagement data using efficient lookups
//       {
//         $lookup: {
//           from: "likes",
//           localField: "_id",
//           foreignField: "post",
//           as: "likes",
//         },
//       },
//       {
//         $lookup: {
//           from: "comments",
//           localField: "_id",
//           foreignField: "post",
//           as: "comments",
//         },
//       },

//       // Stage 3: Add user information with projection
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "userInfo",
//           pipeline: [
//             {
//               $project: {
//                 fullName: 1,
//                 profileImage: 1,
//               },
//             },
//           ],
//         },
//       },

//       // Stage 4: Calculate all fields and scoring in one stage
//       {
//         $addFields: {
//           // Replace userId with user object
//           userId: { $arrayElemAt: ["$userInfo", 0] },

//           // Calculate engagement metrics
//           likesCount: { $size: "$likes" },
//           commentsCount: { $size: "$comments" },

//           // Determine if this is a follower post
//           isFollowerPost: {
//             $in: [{ $arrayElemAt: ["$userInfo._id", 0] }, followingIds],
//           },

//           // Calculate recency score (0-200 points, newer = higher)
//           recencyScore: {
//             $max: [
//               0,
//               {
//                 $subtract: [
//                   200,
//                   {
//                     $divide: [
//                       { $subtract: [new Date(), "$createdAt"] },
//                       3600000, // Convert milliseconds to hours
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },

//           // Calculate engagement score (likes×3 + comments×5)
//           engagementScore: {
//             $add: [
//               { $multiply: [{ $size: "$likes" }, 3] },
//               { $multiply: [{ $size: "$comments" }, 5] },
//             ],
//           },

//           // Add randomization for content discovery (0-300 points)
//           randomScore: { $multiply: [{ $rand: {} }, 300] },
//         },
//       },

//       // Stage 5: Calculate final score based on follower status
//       {
//         $addFields: {
//           finalScore: {
//             $cond: {
//               if: "$isFollowerPost",
//               then: {
//                 // Follower posts: High base score + engagement + recency
//                 $add: [
//                   2000, // High base score for follower posts
//                   500, // Freshness bonus
//                   "$recencyScore",
//                   "$engagementScore",
//                 ],
//               },
//               else: {
//                 // Non-follower posts: Lower base + engagement + recency + randomness
//                 $add: [
//                   200, // Lower base score for discovery
//                   "$recencyScore",
//                   "$engagementScore",
//                   "$randomScore", // Randomization for discovery
//                 ],
//               },
//             },
//           },
//           // 🎯 All posts are fresh since we exclude viewed posts on ALL pages
//           isFresh: true,
//         },
//       },

//       // Stage 6: Sort by calculated score (highest first)
//       { $sort: { finalScore: -1 } },

//       // Stage 7: Apply limit only (no skip - pagination through exclusion)
//       { $limit: limit },

//       // Stage 8: Check if current user has liked each post
//       {
//         $lookup: {
//           from: "likes",
//           let: { postId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$post", "$$postId"] },
//                     { $eq: ["$user", userId] },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "userLike",
//         },
//       },

//       // Stage 9: Final projection - clean response
//       {
//         $project: {
//           _id: 1,
//           content: 1,
//           mediaFiles: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           userId: 1,
//           likesCount: 1,
//           commentsCount: 1,
//           isLiked: { $gt: [{ $size: "$userLike" }, 0] },
//           isFollowerPost: 1,
//           isFresh: 1,
//           // Hide internal calculation fields
//           likes: 0,
//           comments: 0,
//           userInfo: 0,
//           userLike: 0,
//           finalScore: 0,
//           recencyScore: 0,
//           engagementScore: 0,
//           randomScore: 0,
//         },
//       },
//     ];

//     // Execute the optimized aggregation pipeline
//     const freshPosts = await Post.aggregate(feedPipeline);

//     console.log(
//       `✅ Fetched ${freshPosts.length} fresh posts via optimized pipeline`
//     );

//     // Fallback: Add older content if we don't have enough fresh posts
//     let finalPosts = freshPosts;
//     if (freshPosts.length < limit && viewedPostIds.length > 0) {
//       console.log("🔄 Adding fallback content for better user experience");

//       const fallbackPipeline = [
//         {
//           $match: {
//             userId: { $ne: userId }, // Exclude own posts
//             _id: { $in: viewedPostIds }, // Include previously viewed posts
//           },
//         },
//         {
//           $lookup: {
//             from: "users",
//             localField: "userId",
//             foreignField: "_id",
//             as: "userInfo",
//             pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
//           },
//         },
//         {
//           $addFields: {
//             userId: { $arrayElemAt: ["$userInfo", 0] },
//             finalScore: { $multiply: [{ $rand: {} }, 50] }, // Lower scores
//             isFollowerPost: {
//               $in: [{ $arrayElemAt: ["$userInfo._id", 0] }, followingIds],
//             },
//             isFresh: false, // Mark as not fresh
//           },
//         },
//         { $sort: { finalScore: -1 } },
//         { $limit: limit - freshPosts.length },
//         {
//           $lookup: {
//             from: "likes",
//             let: { postId: "$_id" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$post", "$$postId"] },
//                       { $eq: ["$user", userId] },
//                     ],
//                   },
//                 },
//               },
//             ],
//             as: "userLike",
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             content: 1,
//             mediaFiles: 1,
//             createdAt: 1,
//             updatedAt: 1,
//             userId: 1,
//             isLiked: { $gt: [{ $size: "$userLike" }, 0] },
//             isFollowerPost: 1,
//             isFresh: 1,
//           },
//         },
//       ];

//       const fallbackPosts = await Post.aggregate(fallbackPipeline);
//       finalPosts = [...freshPosts, ...fallbackPosts];

//       console.log(
//         `📈 Added ${fallbackPosts.length} fallback posts. Total: ${finalPosts.length}`
//       );
//     }

//     // Generate comprehensive feed analytics
//     const feedInfo = {
//       followingCount: followingIds.length,
//       followerPostsCount: finalPosts.filter((p) => p.isFollowerPost).length,
//       randomPostsCount: finalPosts.filter((p) => !p.isFollowerPost).length,
//       freshPostsCount: finalPosts.filter((p) => p.isFresh).length,
//       viewedPostsExcluded: viewedPostIds.length,
//       totalResults: finalPosts.length,
//       isOptimized: true,
//     };

//     // Return standardized response
//     res.status(200).json({
//       success: true,
//       data: {
//         posts: finalPosts,
//         pagination: {
//           page,
//           limit,
//           // 🎯 Instagram approach: Pagination through exclusion, not traditional pages
//           totalPages: 1, // Not meaningful with view exclusion
//           totalResults: finalPosts.length,
//           hasNextPage: finalPosts.length === limit, // More fresh content available
//           hasFreshContent: true, // All content is fresh since viewed posts excluded
//         },
//         feedInfo,
//       },
//     });
//   } catch (error) {
//     console.error("🚨 Feed generation error:", error);
//     next(error);
//   }
// };

/**
 * Personalized feed (IG/FB-style) with global SKIP over the blended fresh stream.
 * - Follower vs discovery via $facet (ratio)
 * - Excludes viewed posts on ALL pages
 * - Uses denormalized likesCount/commentsCount on Post
 * - SKIP applies AFTER merge+sort (global), so each facet overfetches (skip+limit)
 * - Fallback to previously viewed, then global, to fill `limit`
 * @route GET /api/posts/feed
 */
// exports.getUserFeed = async (req, res, next) => {
//   try {
//     // ---- Params & tunables ----
//     const userId = new Types.ObjectId(String(req.user._id));
//     const limit = Math.max(1, parseInt(req.query.limit) || 10);

//     // optional skip (fresh-only global pagination)
//     const rawSkip = parseInt(req.query.skip);
//     const skip = Number.isFinite(rawSkip) && rawSkip > 0 ? rawSkip : 0;

//     const f1Offset = Math.max(0, parseInt(req.query.f1Offset) || 0);
//     const f2Offset = Math.max(0, parseInt(req.query.f2Offset) || 0);

//     const FOLLOWER_RATIO = 0.7; // follower/discovery blend
//     const WINDOW_DAYS = 14; // consider recent posts only
//     const VIEWED_NIN_CAP = 2000; // cap exclusion list for $nin
//     const windowStart = new Date(
//       Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
//     );

//     // ---- Parallel user context ----
//     const [viewedRaw, follows] = await Promise.all([
//       PostView.getUserViewedPosts(userId, 7), // array of Post _ids seen recently
//       Follow.find({ follower: userId }).select("following"),
//     ]);

//     // ---- Cast ids to ObjectId ----
//     const viewedPostIdsAll = (viewedRaw || []).map(
//       (id) => new Types.ObjectId(String(id))
//     );
//     const viewedPostIds = viewedPostIdsAll.slice(0, VIEWED_NIN_CAP);
//     const followingIds = (follows || []).map(
//       (f) => new Types.ObjectId(String(f.following))
//     );

//     // 1) Quotas per page
//     const followerQuota = Math.ceil(limit * FOLLOWER_RATIO);
//     const discoveryQuota = Math.max(0, limit - followerQuota);

//     // 2) Per-facet skips (proportional to overall skip)
//     const followerSkip = Math.floor(skip * FOLLOWER_RATIO);
//     const discoverySkip = Math.max(0, skip - followerSkip);

//     // ---- Base pipeline: prune, attach author, surface counters ----
//     const baseStages = [
//       {
//         $match: {
//           createdAt: { $gte: windowStart },
//           userId: { $ne: userId },
//           _id: { $nin: viewedPostIds },
//         },
//       },
//       { $set: { posterId: "$userId" } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "posterId",
//           foreignField: "_id",
//           as: "author",
//           pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
//         },
//       },
//       {
//         $set: { author: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] } },
//       },
//       {
//         $set: {
//           likesCount: { $ifNull: ["$likesCount", 0] },
//           commentsCount: { $ifNull: ["$commentsCount", 0] },
//         },
//       },
//     ];

//     // ---- Faceted ranking: follower vs discovery (overfetch: skip+limit) ----
//     const facetStage = {
//       $facet: {
//         follower: [
//           { $match: { posterId: { $in: followingIds } } },
//           {
//             $addFields: {
//               recencyScore: {
//                 $max: [
//                   0,
//                   {
//                     $subtract: [
//                       200,
//                       {
//                         $divide: [
//                           { $subtract: [new Date(), "$createdAt"] },
//                           3600000,
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//               engagementScore: {
//                 $add: [
//                   { $multiply: ["$likesCount", 3] },
//                   { $multiply: ["$commentsCount", 5] },
//                 ],
//               },
//               finalScore: {
//                 $add: [2000, 500, "$recencyScore", "$engagementScore"],
//               },
//               isFollowerPost: true,
//               isFresh: true,
//             },
//           },
//           { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
//           ...(followerSkip ? [{ $skip: followerSkip }] : []),
//           { $limit: Math.max(0, followerQuota) },
//           {
//             $lookup: {
//               from: "likes",
//               let: { pid: "$_id", uid: userId },
//               pipeline: [
//                 {
//                   $match: {
//                     $expr: {
//                       $and: [
//                         { $eq: ["$post", "$$pid"] },
//                         { $eq: ["$user", "$$uid"] },
//                       ],
//                     },
//                   },
//                 },
//                 { $limit: 1 },
//               ],
//               as: "userLike",
//             },
//           },
//           {
//             $project: {
//               _id: 1,
//               content: 1,
//               mediaFiles: 1,
//               createdAt: 1,
//               updatedAt: 1,
//               posterId: 1,
//               author: 1,
//               likesCount: 1,
//               commentsCount: 1,
//               isFollowerPost: 1,
//               isFresh: 1,
//               isLiked: { $gt: [{ $size: "$userLike" }, 0] },
//             },
//           },
//         ],

//         discovery: [
//           { $match: { posterId: { $nin: followingIds } } },
//           {
//             $addFields: {
//               recencyScore: {
//                 $max: [
//                   0,
//                   {
//                     $subtract: [
//                       200,
//                       {
//                         $divide: [
//                           { $subtract: [new Date(), "$createdAt"] },
//                           3600000,
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//               engagementScore: {
//                 $add: [
//                   { $multiply: ["$likesCount", 3] },
//                   { $multiply: ["$commentsCount", 5] },
//                 ],
//               },
//               // instead of $rand
//               randomScore: { $mod: [{ $toLong: "$_id" }, 300] },

//               finalScore: {
//                 $add: [
//                   200,
//                   "$recencyScore",
//                   "$engagementScore",
//                   "$randomScore",
//                 ],
//               },
//               isFollowerPost: false,
//               isFresh: true,
//             },
//           },
//           { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
//           ...(discoverySkip ? [{ $skip: discoverySkip }] : []),
//           { $limit: Math.max(0, discoveryQuota) },
//           {
//             $lookup: {
//               from: "likes",
//               let: { pid: "$_id", uid: userId },
//               pipeline: [
//                 {
//                   $match: {
//                     $expr: {
//                       $and: [
//                         { $eq: ["$post", "$$pid"] },
//                         { $eq: ["$user", "$$uid"] },
//                       ],
//                     },
//                   },
//                 },
//                 { $limit: 1 },
//               ],
//               as: "userLike",
//             },
//           },
//           {
//             $project: {
//               _id: 1,
//               content: 1,
//               mediaFiles: 1,
//               createdAt: 1,
//               updatedAt: 1,
//               posterId: 1,
//               author: 1,
//               likesCount: 1,
//               commentsCount: 1,
//               isFollowerPost: 1,
//               isFresh: 1,
//               isLiked: { $gt: [{ $size: "$userLike" }, 0] },
//             },
//           },
//         ],
//       },
//     };

//     // ---- Merge facets -> global sort -> SKIP -> LIMIT ----
//     const mergeAndTrim = [
//       {
//         $project: { combined: { $concatArrays: ["$follower", "$discovery"] } },
//       },
//       { $unwind: "$combined" },
//       { $replaceRoot: { newRoot: "$combined" } },
//       { $sort: { isFollowerPost: -1, createdAt: -1, _id: -1 } },
//       { $limit: limit },
//     ];

//     const freshPosts = await Post.aggregate(
//       [...baseStages, facetStage, ...mergeAndTrim],
//       { allowDiskUse: true }
//     );

//     let finalPosts = freshPosts;

//     let viewedFallback = [];
//     let globalFallback = [];

//     // ---- Fallback #1: previously viewed (not fresh) ----
//     if (finalPosts.length < limit && viewedPostIds.length > 0) {
//       const need = limit - finalPosts.length;

//       viewedFallback = await Post.aggregate([
//         { $match: { userId: { $ne: userId }, _id: { $in: viewedPostIds } } },
//         { $set: { posterId: "$userId" } },
//         {
//           $lookup: {
//             from: "users",
//             localField: "posterId",
//             foreignField: "_id",
//             as: "author",
//             pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
//           },
//         },
//         {
//           $set: {
//             author: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] },
//             likesCount: { $ifNull: ["$likesCount", 0] },
//             commentsCount: { $ifNull: ["$commentsCount", 0] },
//           },
//         },
//         {
//           $addFields: {
//             isFollowerPost: { $in: ["$posterId", followingIds] },
//             isFresh: false,
//             finalScore: { $multiply: [{ $rand: {} }, 50] },
//           },
//         },
//         { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
//         ...(f1Offset ? [{ $skip: f1Offset }] : []), // ✅ apply offset here
//         { $limit: need },
//         {
//           $lookup: {
//             from: "likes",
//             let: { pid: "$_id", uid: userId },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$post", "$$pid"] },
//                       { $eq: ["$user", "$$uid"] },
//                     ],
//                   },
//                 },
//               },
//               { $limit: 1 },
//             ],
//             as: "userLike",
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             content: 1,
//             mediaFiles: 1,
//             createdAt: 1,
//             updatedAt: 1,
//             posterId: 1,
//             author: 1,
//             likesCount: 1,
//             commentsCount: 1,
//             isFollowerPost: 1,
//             isFresh: 1,
//             isLiked: { $gt: [{ $size: "$userLike" }, 0] },
//           },
//         },
//       ]);

//       finalPosts = [...finalPosts, ...viewedFallback];
//     }

//     // ---- Fallback #2: global (brand-new users / empty pools) ----
//     if (finalPosts.length < limit) {
//       const need = limit - finalPosts.length;

//       globalFallback = await Post.aggregate([
//         {
//           $match: {
//             userId: { $ne: userId },
//             _id: { $nin: finalPosts.map((p) => p._id) },
//             createdAt: { $gte: windowStart },
//           },
//         },
//         { $set: { posterId: "$userId" } },
//         {
//           $lookup: {
//             from: "users",
//             localField: "posterId",
//             foreignField: "_id",
//             as: "author",
//             pipeline: [{ $project: { fullName: 1, profileImage: 1 } }],
//           },
//         },
//         {
//           $set: {
//             author: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] },
//             likesCount: { $ifNull: ["$likesCount", 0] },
//             commentsCount: { $ifNull: ["$commentsCount", 0] },
//           },
//         },
//         {
//           $addFields: {
//             isFollowerPost: { $in: ["$posterId", followingIds] },
//             isFresh: true,
//             finalScore: {
//               $add: [
//                 { $multiply: [{ $rand: {} }, 25] },
//                 { $cond: [{ $in: ["$posterId", followingIds] }, 100, 0] },
//               ],
//             },
//           },
//         },
//         { $sort: { finalScore: -1, createdAt: -1, _id: -1 } },
//         ...(f2Offset ? [{ $skip: f2Offset }] : []), // ✅ apply offset here
//         { $limit: need },
//         {
//           $lookup: {
//             from: "likes",
//             let: { pid: "$_id", uid: userId },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$post", "$$pid"] },
//                       { $eq: ["$user", "$$uid"] },
//                     ],
//                   },
//                 },
//               },
//               { $limit: 1 },
//             ],
//             as: "userLike",
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             content: 1,
//             mediaFiles: 1,
//             createdAt: 1,
//             updatedAt: 1,
//             posterId: 1,
//             author: 1,
//             likesCount: 1,
//             commentsCount: 1,
//             isFollowerPost: 1,
//             isFresh: 1,
//             isLiked: { $gt: [{ $size: "$userLike" }, 0] },
//           },
//         },
//       ]);

//       finalPosts = [...finalPosts, ...globalFallback];
//     }

//     // ---- Response ----
//     res.status(200).json({
//       success: true,
//       data: {
//         posts: finalPosts,
//         pagination: {
//           page: 1,
//           limit,
//           skip,
//           totalPages: 1,
//           totalResults: finalPosts.length,
//           hasNextPage: finalPosts.length === limit,
//           hasPrevPage: skip > 0,
//           f1Returned: viewedFallback.length,
//           f2Returned: globalFallback.length,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("🚨 Feed generation error:", error);
//     next(error);
//   }
// };

// controllers/feedController.js
