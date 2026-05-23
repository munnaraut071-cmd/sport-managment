const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'alert', 'info', 'success', 'warning'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Kit', 'Transaction', 'User', 'Tournament', 'Fine']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  action: {
    type: String
  },
  category: {
    type: String
  },
  readAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for frontend compatibility
notificationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Calculate time ago string for frontend
notificationSchema.virtual('time').get(function() {
  const diffInMs = new Date() - this.createdAt;
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInMins > 0) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Index for faster queries
notificationSchema.index({ user: 1, status: 1, createdAt: -1 });

// Static method to get unread notifications
notificationSchema.statics.getUnread = function(userId) {
  return this.find({ user: userId, status: 'unread' }).sort({ createdAt: -1 });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { status: 'read', readAt: new Date() },
    { new: true }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
