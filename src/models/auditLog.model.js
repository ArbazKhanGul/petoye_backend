const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const auditLogSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "USER_CREATE",
        "USER_UPDATE", 
        "USER_DELETE",
        "USER_SUSPEND",
        "USER_ACTIVATE",
        "POST_DELETE",
        "POST_FLAG",
        "POST_UNFLAG",
        "TOKEN_ADJUSTMENT",
        "ADMIN_LOGIN",
        "ADMIN_LOGOUT",
        "SETTINGS_UPDATE",
        "DATA_EXPORT",
        "BULK_ACTION"
      ]
    },
    targetType: {
      type: String,
      enum: ["User", "Post", "Admin", "System", "Token"],
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Flexible object for action details
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed, // Store previous state for rollback
    },
    newData: {
      type: mongoose.Schema.Types.Mixed, // Store new state
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLog;
