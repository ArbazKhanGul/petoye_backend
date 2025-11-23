const {
  Competition,
  CompetitionEntry,
  CompetitionVote,
  User,
  TokenTransaction,
} = require("../models");
const AppError = require("../errors/appError");
const crypto = require("crypto");

/**
 * Get current active competition and upcoming competition
 * @route GET /api/competitions/current
 */
exports.getCurrentCompetitions = async (req, res, next) => {
  try {
    const now = new Date();

    // Get active competition
    const activeCompetition = await Competition.findOne({
      status: "active",
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).lean();

    // Get upcoming competition
    const upcomingCompetition = await Competition.findOne({
      status: "upcoming",
      startTime: { $gt: now },
    })
      .sort({ startTime: 1 })
      .lean();

    // Get user's entry for active competition if exists
    let userEntry = null;
    if (activeCompetition && req.user) {
      userEntry = await CompetitionEntry.findOne({
        competitionId: activeCompetition._id,
        userId: req.user._id,
        status: "active",
      }).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        active: activeCompetition,
        upcoming: upcomingCompetition,
        userEntry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get previous winners (last completed competition)
 * @route GET /api/competitions/previous-winners
 */
exports.getPreviousWinners = async (req, res, next) => {
  try {
    const lastCompetition = await Competition.findOne({
      status: "completed",
      prizesDistributed: true,
    })
      .sort({ endTime: -1 })
      .populate({
        path: "winners.first.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .populate({
        path: "winners.second.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .populate({
        path: "winners.third.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .lean();
    console.log("🚀 ~ lastCompetition:", lastCompetition);

    res.status(200).json({
      success: true,
      data: lastCompetition,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get competition details with entries
 * @route GET /api/competitions/:competitionId
 */
exports.getCompetitionDetails = async (req, res, next) => {
  try {
    const { competitionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const votedOnly = req.query.votedOnly === "true";
    console.log("🚀 ~ votedOnly:", votedOnly);
    const skip = (page - 1) * limit;

    const competition = await Competition.findById(competitionId).lean();
    if (!competition) {
      return next(new AppError("Competition not found", 404));
    }

    // Get user's votes if authenticated (fetch once and reuse)
    let userVotes = [];
    let votedEntryIds = [];
    if (req.user) {
      userVotes = await CompetitionVote.find({
        competitionId,
        userId: req.user._id,
      })
        .select("entryId")
        .lean();

      votedEntryIds = userVotes.map((v) => v.entryId);
    }
    // console.log("🚀 ~ userVotes:", userVotes);
    // console.log("🚀 ~ req.user._id:", req.user);

    // Build filter for entries based on votedOnly parameter
    let entryIdsFilter = {};
    if (votedOnly) {
      // Only show entries that user has voted for
      entryIdsFilter = { _id: { $in: votedEntryIds } };
    }

    // Get entries with pagination
    const entries = await CompetitionEntry.find({
      competitionId,
      status: "active",
      ...entryIdsFilter,
    })
      .sort({ votesCount: -1, createdAt: 1 }) // Sort by votes, then by submission time
      .skip(skip)
      .limit(limit)
      .populate("userId", "fullName username profileImage")
      .lean();
    // console.log("🚀 ~ entries:", entries);

    // Get total entries count
    const totalEntries = await CompetitionEntry.countDocuments({
      competitionId,
      status: "active",
      ...entryIdsFilter,
    });

    // Convert voted entry IDs to strings for comparison
    const userVotedEntryIds = votedEntryIds.map((id) => id.toString());

    // Add hasVoted flag to each entry
    const entriesWithVoteStatus = entries.map((entry) => ({
      ...entry,
      hasVoted: userVotedEntryIds.includes(entry._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data: {
        competition,
        entries: entriesWithVoteStatus,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalEntries / limit),
          totalEntries,
          hasMore: skip + entries.length < totalEntries,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit competition entry
 * @route POST /api/competitions/:competitionId/entry
 */
exports.submitEntry = async (req, res, next) => {
  try {
    const { competitionId } = req.params;
    const { petName, description } = req.body;
    const userId = req.user._id;

    console.log("📝 Submit Entry - Request Body:", req.body);
    console.log(
      "📸 Submit Entry - File:",
      req.file
        ? {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            cloudFrontUrl: req.file.cloudFrontUrl,
            location: req.file.location,
          }
        : "NO FILE"
    );

    // Validate petName
    if (!petName || !petName.trim()) {
      return next(new AppError("Pet name is required", 400));
    }

    if (petName.trim().length > 100) {
      return next(
        new AppError("Pet name must be less than 100 characters", 400)
      );
    }

    // Validate description if provided
    if (description && description.length > 500) {
      return next(
        new AppError("Description must be less than 500 characters", 400)
      );
    }

    // Check if photo was uploaded
    if (!req.file) {
      return next(new AppError("Pet photo is required", 400));
    }

    // Get photo URL from uploaded file
    const photoUrl =
      req.file.cloudFrontUrl ||
      req.file.location ||
      `/images/competition/${req.file.generatedFilename}`;

    // Get competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return next(new AppError("Competition not found", 404));
    }

    // Check if within entry window
    const now = new Date();
    console.log("🚀 ~ competition.entryStartTime:", competition.entryStartTime);
    if (now < competition.entryStartTime) {
      console.log(
        "🚀 ~ now < competition.entryStartTime:",
        now < competition.entryStartTime
      );
      return next(
        new AppError(
          `Entry window opens at ${competition.entryStartTime.toISOString()}`,
          400
        )
      );
    }
    if (now > competition.entryEndTime) {
      return next(new AppError("Entry window has closed", 400));
    }

    // Check if user already has an entry
    // const existingEntry = await CompetitionEntry.findOne({
    //   competitionId,
    //   userId,
    //   status: "active",
    // });
    // if (existingEntry) {
    //   return next(
    //     new AppError(
    //       "You already have an active entry in this competition",
    //       400
    //     )
    //   );
    // }

    // Check user's token balance
    const user = await User.findById(userId);
    if (user.tokens < competition.entryFee) {
      return next(
        new AppError(
          `Insufficient tokens. Required: ${competition.entryFee}, Available: ${user.tokens}`,
          400
        )
      );
    }

    // Create entry
    const entry = await CompetitionEntry.create({
      competitionId,
      userId,
      petName,
      description,
      photoUrl,
      entryFeePaid: competition.entryFee,
    });

    // Deduct tokens from user
    user.tokens -= competition.entryFee;
    await user.save();

    // Add to prize pool
    competition.prizePool += competition.entryFee;
    competition.totalEntries += 1;
    await competition.save();

    // Record token transaction
    await TokenTransaction.create({
      user: userId,
      amount: -competition.entryFee,
      type: "competition_entry",
      relatedId: entry._id,
      metadata: {
        competitionId,
        entryId: entry._id,
      },
    });

    // Populate user details
    await entry.populate("userId", "fullName username profileImage");

    res.status(201).json({
      success: true,
      message: "Entry submitted successfully",
      data: {
        entry,
        updatedTokenBalance: user.tokens, // Return updated token balance
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel competition entry
 * @route DELETE /api/competitions/:competitionId/entry
 */
exports.cancelEntry = async (req, res, next) => {
  try {
    const { competitionId, entryId } = req.params;
    const userId = req.user._id;

    // Get competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return next(new AppError("Competition not found", 404));
    }

    // Check if still within cancellation window
    const now = new Date();
    if (now > competition.entryEndTime) {
      return next(new AppError("Cancellation window has closed", 400));
    }

    // Get the specific entry by ID and verify ownership
    const entry = await CompetitionEntry.findOne({
      _id: entryId,
      competitionId,
      userId,
      status: "active",
    });
    if (!entry) {
      return next(
        new AppError(
          "Entry not found or you don't have permission to cancel it",
          404
        )
      );
    }

    // Check if already refunded
    if (entry.refunded) {
      return next(new AppError("Entry already cancelled and refunded", 400));
    }

    // Mark entry as cancelled
    entry.status = "cancelled";
    entry.refunded = true;
    entry.refundedAt = new Date();
    await entry.save();

    // Refund tokens to user
    const user = await User.findById(userId);
    user.tokens += entry.entryFeePaid;
    await user.save();

    // Update competition stats
    competition.prizePool -= entry.entryFeePaid;
    competition.totalEntries -= 1;
    await competition.save();

    // Record refund transaction
    await TokenTransaction.create({
      user: userId,
      amount: entry.entryFeePaid,
      type: "competition_refund",
      relatedId: entry._id,
      metadata: {
        competitionId,
        entryId: entry._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Entry cancelled and tokens refunded",
      data: {
        refundedAmount: entry.entryFeePaid,
        updatedTokenBalance: user.tokens, // Return updated token balance
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vote for an entry
 * @route POST /api/competitions/:competitionId/vote/:entryId
 */
exports.voteForEntry = async (req, res, next) => {
  try {
    const { competitionId, entryId } = req.params;
    const { deviceInfo, deviceFingerprint: providedFingerprint } = req.body;
    const userId = req.user._id;

    // Get competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return next(new AppError("Competition not found", 404));
    }

    // Check if competition is active
    if (competition.status !== "active") {
      return next(new AppError("Competition is not active", 400));
    }

    // Get entry
    const entry = await CompetitionEntry.findById(entryId);
    if (!entry) {
      return next(new AppError("Entry not found", 404));
    }

    // Check if entry belongs to this competition
    if (entry.competitionId.toString() !== competitionId) {
      return next(
        new AppError("Entry does not belong to this competition", 400)
      );
    }

    // Check if entry is active
    if (entry.status !== "active") {
      return next(new AppError("Cannot vote for cancelled entry", 400));
    }

    // Check if user is voting for their own entry
    if (entry.userId.toString() === userId.toString()) {
      return next(new AppError("Cannot vote for your own entry", 400));
    }

    // Use provided fingerprint from frontend, or create one from deviceInfo
    // Frontend sends SHA256 hash, so we use that if available
    let deviceFingerprint;
    if (providedFingerprint) {
      deviceFingerprint = providedFingerprint;
    } else {
      // Fallback: create fingerprint from deviceInfo (backward compatibility)
      deviceFingerprint = crypto
        .createHash("sha256")
        .update(
          `${deviceInfo.deviceId}-${deviceInfo.deviceModel}-${deviceInfo.platform}`
        )
        .digest("hex");
    }

    // Check if user already voted in this competition
    const existingUserVote = await CompetitionVote.findOne({
      competitionId,
      userId,
    });
    if (existingUserVote) {
      return next(
        new AppError("You have already voted in this competition", 400)
      );
    }

    // Check if device already voted in this competition
    const existingDeviceVote = await CompetitionVote.findOne({
      competitionId,
      deviceFingerprint,
    });
    if (existingDeviceVote) {
      return next(
        new AppError("This device has already voted in this competition", 400)
      );
    }

    // Get IP address
    const ipAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Create vote
    const vote = await CompetitionVote.create({
      competitionId,
      entryId,
      userId,
      deviceFingerprint,
      deviceInfo,
      ipAddress,
    });

    // Increment vote count on entry
    entry.votesCount += 1;
    await entry.save();

    // Update competition total votes
    competition.totalVotes += 1;
    await competition.save();

    res.status(201).json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        votesCount: entry.votesCount,
      },
    });
  } catch (error) {
    // Handle duplicate vote error
    if (error.code === 11000) {
      return next(new AppError("You already voted for this entry", 400));
    }
    next(error);
  }
};

/**
 * Get user's entry for a competition
 * @route GET /api/competitions/:competitionId/my-entry
 */
exports.getMyEntry = async (req, res, next) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user._id;

    const entry = await CompetitionEntry.findOne({
      competitionId,
      userId,
      status: "active",
    })
      .populate("userId", "fullName username profileImage")
      .lean();

    if (!entry) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    // Get entry's rank
    const higherRankedCount = await CompetitionEntry.countDocuments({
      competitionId,
      status: "active",
      votesCount: { $gt: entry.votesCount },
    });

    const rank = higherRankedCount + 1;

    res.status(200).json({
      success: true,
      data: {
        ...entry,
        rank,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get leaderboard for a competition
 * @route GET /api/competitions/:competitionId/leaderboard
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { competitionId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const topEntries = await CompetitionEntry.find({
      competitionId,
      status: "active",
    })
      .sort({ votesCount: -1, createdAt: 1 })
      .limit(limit)
      .populate("userId", "fullName username profileImage")
      .lean();

    res.status(200).json({
      success: true,
      data: topEntries,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get competitions by status with optional date filter
 * @route GET /api/competitions
 * @query status - all, active, upcoming, previous, cancelled (default: all)
 * @query startDate - filter from date (ISO string)
 * @query endDate - filter to date (ISO string)
 * @query page - page number (default: 1)
 * @query limit - items per page (default: 10)
 */
exports.getCompetitionsByStatus = async (req, res, next) => {
  try {
    const { status = "all", startDate, endDate } = req.query;
    console.log("🚀 ~ status:", status);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const now = new Date();

    // Build query based on status
    let query = {};

    if (status === "active") {
      query = {
        status: "active",
        startTime: { $lte: now },
        endTime: { $gte: now },
      };
    } else if (status === "upcoming") {
      query = {
        status: "upcoming",
        startTime: { $gt: now },
      };
    } else if (status === "previous") {
      query = {
        status: "completed",
        prizesDistributed: true,
      };
    } else if (status === "cancelled") {
      query = {
        status: "cancelled",
      };
    } else if (status === "all") {
      // For "all", include active, upcoming, completed, and cancelled competitions
      query = {
        $or: [
          { status: "active" },
          { status: "upcoming" },
          { status: "completed", prizesDistributed: true },
          { status: "cancelled" },
        ],
      };
    }

    // Add date range filter if provided
    // Note: date field is stored as string (YYYY-MM-DD), so we use string comparison
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        // Convert to YYYY-MM-DD format if it's a Date object
        const formattedStart = startDate.includes("T")
          ? startDate.split("T")[0]
          : startDate;
        query.date.$gte = formattedStart;
      }
      if (endDate) {
        // Convert to YYYY-MM-DD format if it's a Date object
        const formattedEnd = endDate.includes("T")
          ? endDate.split("T")[0]
          : endDate;
        query.date.$lte = formattedEnd;
      }
    }

    // Fetch competitions
    const competitions = await Competition.find(query)
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "winners.first.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .populate({
        path: "winners.second.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .populate({
        path: "winners.third.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .lean();
    console.log(
      "🚀 ~ competitions:",
      competitions.map((ob) => {
        console.log("🚀 ~ competition id:", ob.winners);
      })
    );

    // Get user's entry for each competition if user is authenticated
    let competitionsWithUserEntry = competitions;
    if (req.user) {
      competitionsWithUserEntry = await Promise.all(
        competitions.map(async (competition) => {
          const userEntry = await CompetitionEntry.findOne({
            competitionId: competition._id,
            userId: req.user._id,
            status: "active",
          })
            .select("petName photoUrl votesCount rank")
            .lean();

          return {
            ...competition,
            userEntry: userEntry || null,
          };
        })
      );
    }

    const total = await Competition.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        competitions: competitionsWithUserEntry,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasMore: page < Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get past competitions with winners
 * @route GET /api/competitions/past
 */
exports.getPastCompetitions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const competitions = await Competition.find({
      status: "completed",
      prizesDistributed: true,
    })
      .sort({ endTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "winners.first.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .populate({
        path: "winners.second.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .populate({
        path: "winners.third.entryId",
        select: "petName photoUrl votesCount userId",
        populate: {
          path: "userId",
          select: "fullName username profileImage",
        },
      })
      .lean();

    const total = await Competition.countDocuments({
      status: "completed",
      prizesDistributed: true,
    });

    res.status(200).json({
      success: true,
      data: {
        competitions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single entry details with vote status
 * @route GET /api/competitions/:competitionId/entries/:entryId
 */
exports.getEntryDetails = async (req, res, next) => {
  try {
    const { competitionId, entryId } = req.params;
    const userId = req.user._id;

    // Find the competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return next(new AppError("Competition not found", 404));
    }

    // Find the entry
    const entry = await CompetitionEntry.findOne({
      _id: entryId,
      competitionId,
      status: "active",
    })
      .populate("userId", "fullName username profileImage")
      .lean();

    if (!entry) {
      return next(new AppError("Entry not found", 404));
    }

    // Check if user has already voted in this competition
    const userVote = await CompetitionVote.findOne({
      competitionId,
      userId,
    });

    // Get device fingerprint from request header (if available)
    const deviceFingerprint = req.headers["x-device-fingerprint"];

    // Check if device has already voted
    let deviceVoted = false;
    if (deviceFingerprint) {
      const deviceVote = await CompetitionVote.findOne({
        competitionId,
        deviceFingerprint,
      });
      deviceVoted = !!deviceVote;
    }

    // Check if user is voting for their own entry
    const isOwnEntry = entry.userId._id.toString() === userId.toString();

    // Determine voting status and message
    let canVote = false;
    let voteStatusMessage = "";
    let hasVoted = false;

    if (competition.status !== "active") {
      voteStatusMessage = "Competition is not active";
    } else if (isOwnEntry) {
      voteStatusMessage = "You cannot vote for your own entry";
    } else if (userVote) {
      hasVoted = userVote.entryId?.toString() === entryId;
      if (hasVoted) {
        voteStatusMessage = "You have voted for this entry";
      } else {
        voteStatusMessage = "You have already voted in this competition";
      }
    } else if (deviceVoted) {
      hasVoted = true;
      voteStatusMessage = "Vote from your device already given";
    } else {
      canVote = true;
      voteStatusMessage = "You can vote for this entry";
    }

    res.status(200).json({
      success: true,
      data: {
        entry,
        canVote,
        hasVoted,
        voteStatusMessage,
        voteStatus: {
          competitionActive: competition.status === "active",
          isOwnEntry,
          userHasVoted: !!userVote,
          deviceHasVoted: deviceVoted,
          votedForThisEntry: hasVoted,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
