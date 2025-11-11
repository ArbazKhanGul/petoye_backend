const AppVersion = require("../../models/appVersion.model");
const AppError = require("../../errors/appError");

/**
 * Get all app versions
 */
const getAllAppVersions = async (req, res, next) => {
  try {
    const versions = await AppVersion.find().sort({ platform: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        versions,
        total: versions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get app version by platform
 */
const getAppVersionByPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;
    
    if (!['android', 'ios'].includes(platform)) {
      return next(new AppError('Invalid platform. Must be android or ios', 400));
    }
    
    const version = await AppVersion.findOne({ platform });
    
    if (!version) {
      return res.status(200).json({
        success: true,
        data: {
          version: null,
          message: `No version configuration found for ${platform}`,
        },
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        version,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update app version (upsert)
 */
const upsertAppVersion = async (req, res, next) => {
  try {
    const {
      platform,
      minimumVersion,
      latestVersion,
      updateMessage,
      forceUpdateMessage,
      isActive,
    } = req.body;
    
    // Validate platform
    if (!['android', 'ios'].includes(platform)) {
      return next(new AppError('Invalid platform. Must be android or ios', 400));
    }
    
    // Validate version format (x.y.z)
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(minimumVersion) || !versionRegex.test(latestVersion)) {
      return next(new AppError('Version must be in format x.y.z (e.g., 1.0.0)', 400));
    }
    
    // Compare versions to ensure latest >= minimum
    const minParts = minimumVersion.split('.').map(Number);
    const latestParts = latestVersion.split('.').map(Number);
    
    let isLatestValid = false;
    for (let i = 0; i < 3; i++) {
      if (latestParts[i] > minParts[i]) {
        isLatestValid = true;
        break;
      } else if (latestParts[i] < minParts[i]) {
        return next(new AppError('Latest version must be greater than or equal to minimum version', 400));
      }
    }
    
    // Upsert the app version
    const version = await AppVersion.findOneAndUpdate(
      { platform },
      {
        platform,
        minimumVersion,
        latestVersion,
        updateMessage: updateMessage || "A new version of the app is available.",
        forceUpdateMessage: forceUpdateMessage || "You must update the app to continue using it.",
        isActive: isActive !== undefined ? isActive : true,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        version,
        message: `App version for ${platform} ${version.isNew ? 'created' : 'updated'} successfully`,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError(`App version for this platform already exists`, 409));
    }
    next(error);
  }
};

/**
 * Delete app version
 */
const deleteAppVersion = async (req, res, next) => {
  try {
    const { platform } = req.params;
    
    if (!['android', 'ios'].includes(platform)) {
      return next(new AppError('Invalid platform. Must be android or ios', 400));
    }
    
    const version = await AppVersion.findOneAndDelete({ platform });
    
    if (!version) {
      return next(new AppError(`App version for ${platform} not found`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: `App version for ${platform} deleted successfully`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check app version compatibility (for mobile app use)
 */
const checkVersionCompatibility = async (req, res, next) => {
  try {
    const { platform, currentVersion } = req.body;
    
    if (!platform || !currentVersion) {
      return next(new AppError('Platform and currentVersion are required', 400));
    }
    
    if (!['android', 'ios'].includes(platform)) {
      return next(new AppError('Invalid platform. Must be android or ios', 400));
    }
    
    const versionConfig = await AppVersion.findOne({ 
      platform, 
      isActive: true 
    });
    
    if (!versionConfig) {
      return res.status(200).json({
        success: true,
        data: {
          updateRequired: false,
          forceUpdate: false,
          message: "No version configuration available",
        },
      });
    }
    
    const current = currentVersion.split('.').map(Number);
    const minimum = versionConfig.minimumVersion.split('.').map(Number);
    const latest = versionConfig.latestVersion.split('.').map(Number);
    
    // Check if force update is required
    let forceUpdate = false;
    for (let i = 0; i < 3; i++) {
      if (current[i] < minimum[i]) {
        forceUpdate = true;
        break;
      } else if (current[i] > minimum[i]) {
        break;
      }
    }
    
    // Check if soft update is available
    let updateAvailable = false;
    for (let i = 0; i < 3; i++) {
      if (current[i] < latest[i]) {
        updateAvailable = true;
        break;
      } else if (current[i] > latest[i]) {
        break;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        updateRequired: updateAvailable,
        forceUpdate,
        currentVersion,
        minimumVersion: versionConfig.minimumVersion,
        latestVersion: versionConfig.latestVersion,
        updateMessage: forceUpdate 
          ? versionConfig.forceUpdateMessage 
          : versionConfig.updateMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get app version statistics
 */
const getAppVersionStats = async (req, res, next) => {
  try {
    const androidVersion = await AppVersion.findOne({ platform: 'android' });
    const iosVersion = await AppVersion.findOne({ platform: 'ios' });
    
    const stats = {
      totalPlatforms: 2,
      configuredPlatforms: [androidVersion, iosVersion].filter(Boolean).length,
      platforms: {
        android: {
          configured: !!androidVersion,
          isActive: androidVersion?.isActive || false,
          minimumVersion: androidVersion?.minimumVersion || null,
          latestVersion: androidVersion?.latestVersion || null,
          lastUpdated: androidVersion?.updatedAt || null,
        },
        ios: {
          configured: !!iosVersion,
          isActive: iosVersion?.isActive || false,
          minimumVersion: iosVersion?.minimumVersion || null,
          latestVersion: iosVersion?.latestVersion || null,
          lastUpdated: iosVersion?.updatedAt || null,
        },
      },
    };
    
    res.status(200).json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAppVersions,
  getAppVersionByPlatform,
  upsertAppVersion,
  deleteAppVersion,
  checkVersionCompatibility,
  getAppVersionStats,
};