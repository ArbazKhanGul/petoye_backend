const Competition = require('../../models/competition.model');
const CompetitionEntry = require('../../models/competitionEntry.model');
const CompetitionVote = require('../../models/competitionVote.model');
const AppVersion = require('../../models/appVersion.model');
const User = require('../../models/user.model');
const AppError = require('../../errors/appError');

/**
 * COMPETITION MANAGEMENT
 */

// Get all competitions with filters and pagination
const getAllCompetitions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build query filters
    const filters = {};
    if (status) filters.status = status;
    if (search) {
      filters.date = { $regex: search, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [competitions, totalCount] = await Promise.all([
      Competition.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Competition.countDocuments(filters)
    ]);

    // Get aggregated statistics
    const stats = await Competition.aggregate([
      {
        $group: {
          _id: null,
          totalCompetitions: { $sum: 1 },
          totalPrizePool: { $sum: '$prizePool' },
          totalEntries: { $sum: '$totalEntries' },
          totalVotes: { $sum: '$totalVotes' },
          activeCompetitions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          upcomingCompetitions: {
            $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] }
          },
          completedCompetitions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    };

    res.status(200).json({
      success: true,
      message: 'Competitions fetched successfully',
      data: {
        competitions,
        pagination,
        stats: stats[0] || {
          totalCompetitions: 0,
          totalPrizePool: 0,
          totalEntries: 0,
          totalVotes: 0,
          activeCompetitions: 0,
          upcomingCompetitions: 0,
          completedCompetitions: 0
        }
      }
    });
  } catch (error) {
    next(new AppError('Failed to fetch competitions', 500));
  }
};

// Get competition by ID with detailed information
const getCompetitionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id).lean();
    if (!competition) {
      return next(new AppError('Competition not found', 404));
    }

    // Get entries with user details
    const entries = await CompetitionEntry.find({ competitionId: id })
      .populate('userId', 'fullName username profileImage')
      .sort({ votesCount: -1 })
      .lean();

    // Get vote statistics
    const voteStats = await CompetitionVote.aggregate([
      { $match: { competitionId: competition._id } },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: 1 },
          uniqueVoters: { $addToSet: '$userId' },
          flaggedVotes: {
            $sum: { $cond: ['$flaggedForReview', 1, 0] }
          }
        }
      }
    ]);

    const stats = voteStats[0] || {
      totalVotes: 0,
      uniqueVoters: [],
      flaggedVotes: 0
    };

    res.status(200).json({
      success: true,
      message: 'Competition details fetched successfully',
      data: {
        competition,
        entries,
        stats: {
          ...stats,
          uniqueVoters: stats.uniqueVoters.length
        }
      }
    });
  } catch (error) {
    next(new AppError('Failed to fetch competition details', 500));
  }
};

// Create new competition
const createCompetition = async (req, res, next) => {
  try {
    const {
      date,
      entryFee,
      startTime,
      endTime,
      entryStartTime,
      entryEndTime
    } = req.body;

    // Check if competition already exists for this date
    const existingCompetition = await Competition.findOne({ date });
    if (existingCompetition) {
      return next(new AppError('Competition already exists for this date', 400));
    }

    const competition = new Competition({
      date,
      entryFee,
      startTime,
      endTime,
      entryStartTime,
      entryEndTime
    });

    await competition.save();

    res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      data: competition
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Competition already exists for this date', 400));
    }
    next(new AppError('Failed to create competition', 500));
  }
};

// Update competition
const updateCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating certain fields after competition has started
    const competition = await Competition.findById(id);
    if (!competition) {
      return next(new AppError('Competition not found', 404));
    }

    if (competition.status !== 'upcoming') {
      const restrictedFields = ['date', 'entryFee', 'startTime', 'endTime', 'entryStartTime', 'entryEndTime'];
      restrictedFields.forEach(field => {
        if (updateData[field]) {
          delete updateData[field];
        }
      });
    }

    const updatedCompetition = await Competition.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Competition updated successfully',
      data: updatedCompetition
    });
  } catch (error) {
    next(new AppError('Failed to update competition', 500));
  }
};

// Delete competition (only if no entries)
const deleteCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if competition has entries
    const entriesCount = await CompetitionEntry.countDocuments({ competitionId: id });
    if (entriesCount > 0) {
      return next(new AppError('Cannot delete competition with existing entries', 400));
    }

    const competition = await Competition.findByIdAndDelete(id);
    if (!competition) {
      return next(new AppError('Competition not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Competition deleted successfully'
    });
  } catch (error) {
    next(new AppError('Failed to delete competition', 500));
  }
};

/**
 * COMPETITION ENTRIES MANAGEMENT
 */

// Get all competition entries with filters
const getAllCompetitionEntries = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      competitionId,
      status,
      search,
      sortBy = 'votesCount',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build query filters
    const filters = {};
    if (competitionId) filters.competitionId = competitionId;
    if (status) filters.status = status;
    if (search) {
      filters.$or = [
        { petName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [entries, totalCount] = await Promise.all([
      CompetitionEntry.find(filters)
        .populate('userId', 'fullName username profileImage email')
        .populate('competitionId', 'date status entryFee')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CompetitionEntry.countDocuments(filters)
    ]);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    };

    res.status(200).json({
      success: true,
      message: 'Competition entries fetched successfully',
      data: {
        entries,
        pagination
      }
    });
  } catch (error) {
    next(new AppError('Failed to fetch competition entries', 500));
  }
};

// Get competition entry by ID
const getCompetitionEntryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entry = await CompetitionEntry.findById(id)
      .populate('userId', 'fullName username profileImage email createdAt')
      .populate('competitionId', 'date status entryFee startTime endTime')
      .lean();

    if (!entry) {
      return next(new AppError('Competition entry not found', 404));
    }

    // Get votes for this entry
    const votes = await CompetitionVote.find({ entryId: id })
      .populate('userId', 'fullName username')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Competition entry details fetched successfully',
      data: {
        entry,
        votes
      }
    });
  } catch (error) {
    next(new AppError('Failed to fetch competition entry details', 500));
  }
};

// Delete competition entry
const deleteCompetitionEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entry = await CompetitionEntry.findById(id);
    if (!entry) {
      return next(new AppError('Competition entry not found', 404));
    }

    // Check if competition is still active
    const competition = await Competition.findById(entry.competitionId);
    if (competition.status === 'active') {
      return next(new AppError('Cannot delete entry from active competition', 400));
    }

    // Delete associated votes
    await CompetitionVote.deleteMany({ entryId: id });
    
    // Delete entry
    await CompetitionEntry.findByIdAndDelete(id);

    // Update competition stats
    await Competition.findByIdAndUpdate(entry.competitionId, {
      $inc: { 
        totalEntries: -1,
        totalVotes: -entry.votesCount,
        prizePool: -entry.entryFeePaid
      }
    });

    res.status(200).json({
      success: true,
      message: 'Competition entry deleted successfully'
    });
  } catch (error) {
    next(new AppError('Failed to delete competition entry', 500));
  }
};

/**
 * COMPETITION VOTES MANAGEMENT
 */

// Get all competition votes with filters
const getAllCompetitionVotes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      competitionId,
      entryId,
      flaggedOnly = false,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build query filters
    const filters = {};
    if (competitionId) filters.competitionId = competitionId;
    if (entryId) filters.entryId = entryId;
    if (flaggedOnly === 'true') filters.flaggedForReview = true;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [votes, totalCount] = await Promise.all([
      CompetitionVote.find(filters)
        .populate('userId', 'fullName username email')
        .populate('entryId', 'petName photoUrl')
        .populate('competitionId', 'date status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CompetitionVote.countDocuments(filters)
    ]);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    };

    res.status(200).json({
      success: true,
      message: 'Competition votes fetched successfully',
      data: {
        votes,
        pagination
      }
    });
  } catch (error) {
    next(new AppError('Failed to fetch competition votes', 500));
  }
};

// Flag/unflag vote for review
const flagVoteForReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { flagged, reason } = req.body;

    const updateData = {
      flaggedForReview: flagged
    };

    if (flagged && reason) {
      updateData.flagReason = reason;
    } else if (!flagged) {
      updateData.$unset = { flagReason: 1 };
    }

    const vote = await CompetitionVote.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'fullName username')
     .populate('entryId', 'petName');

    if (!vote) {
      return next(new AppError('Vote not found', 404));
    }

    res.status(200).json({
      success: true,
      message: `Vote ${flagged ? 'flagged for' : 'removed from'} review successfully`,
      data: vote
    });
  } catch (error) {
    next(new AppError('Failed to update vote flag status', 500));
  }
};

// Delete fraudulent vote
const deleteCompetitionVote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vote = await CompetitionVote.findById(id);
    if (!vote) {
      return next(new AppError('Vote not found', 404));
    }

    // Delete vote
    await CompetitionVote.findByIdAndDelete(id);

    // Update entry vote count
    await CompetitionEntry.findByIdAndUpdate(vote.entryId, {
      $inc: { votesCount: -1 }
    });

    // Update competition total votes
    await Competition.findByIdAndUpdate(vote.competitionId, {
      $inc: { totalVotes: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Vote deleted successfully'
    });
  } catch (error) {
    next(new AppError('Failed to delete vote', 500));
  }
};

/**
 * APP VERSION MANAGEMENT
 */

// Get all app versions
const getAllAppVersions = async (req, res, next) => {
  try {
    const versions = await AppVersion.find().sort({ platform: 1 });

    res.status(200).json({
      success: true,
      message: 'App versions fetched successfully',
      data: versions
    });
  } catch (error) {
    next(new AppError('Failed to fetch app versions', 500));
  }
};

// Get app version by platform
const getAppVersionByPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;

    const version = await AppVersion.findOne({ platform });
    if (!version) {
      return next(new AppError('App version not found for this platform', 404));
    }

    res.status(200).json({
      success: true,
      message: 'App version fetched successfully',
      data: version
    });
  } catch (error) {
    next(new AppError('Failed to fetch app version', 500));
  }
};

// Create or update app version
const upsertAppVersion = async (req, res, next) => {
  try {
    const {
      platform,
      minimumVersion,
      latestVersion,
      updateMessage,
      forceUpdateMessage,
      isActive
    } = req.body;

    const version = await AppVersion.findOneAndUpdate(
      { platform },
      {
        minimumVersion,
        latestVersion,
        updateMessage,
        forceUpdateMessage,
        isActive
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'App version updated successfully',
      data: version
    });
  } catch (error) {
    next(new AppError('Failed to update app version', 500));
  }
};

// Delete app version
const deleteAppVersion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const version = await AppVersion.findByIdAndDelete(id);
    if (!version) {
      return next(new AppError('App version not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'App version deleted successfully'
    });
  } catch (error) {
    next(new AppError('Failed to delete app version', 500));
  }
};

module.exports = {
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
};