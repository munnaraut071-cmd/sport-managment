const express = require('express');
const { protect, isSupervisor } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.use(protect);

// ============ GET NOTIFICATIONS ============

// Get user's notifications
router.get('/', async (req, res) => {
  try {
    const { unreadOnly = false, limit = 20, skip = 0 } = req.query;
    let query = { userId: req.user._id };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single notification
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Only owner or admin can view
    if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ UPDATE NOTIFICATIONS ============

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark all notifications as read
router.put('/all/read', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ DELETE NOTIFICATIONS ============

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear all read notifications
router.delete('/clear/all', async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });

    res.status(200).json({
      success: true,
      message: 'Cleared read notifications',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ ADMIN OPERATIONS ============

// Send broadcast notification (Admin only)
router.post('/broadcast', isSupervisor, async (req, res) => {
  try {
    const { title, message, type, priority = 'high' } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and type are required'
      });
    }

    // Send to all supervisors and admins
    const notification = new Notification({
      type,
      title,
      message,
      priority,
      metadata: { broadcastBy: req.user._id }
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Broadcast notification sent',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all notifications (Admin only)
router.get('/admin/all', isSupervisor, async (req, res) => {
  try {
    const { type, priority, limit = 50, skip = 0 } = req.query;
    let query = {};

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const notifications = await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get notification statistics
router.get('/stats/overview', isSupervisor, async (req, res) => {
  try {
    const stats = {
      byType: await Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      byPriority: await Notification.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      unread: await Notification.countDocuments({ isRead: false }),
      total: await Notification.countDocuments()
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
