const { Notification } = require("../models");
const AppError = require("../errors/appError");

exports.list = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor = req.query.cursor; // expects notification _id as cursor

    const query = { user: userId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const items = await Notification.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("actor", "_id fullName profileImage")
      .lean();

    let nextCursor = null;
    if (items.length > limit) {
      nextCursor = items[limit - 1]._id;
      items.splice(limit);
    }

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.json({ items, nextCursor, unreadCount, hasMore: !!nextCursor });
  } catch (err) {
    next(err);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const n = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { isRead: true } }
    );
    if (!n) return next(new AppError("Notification not found", 404));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
