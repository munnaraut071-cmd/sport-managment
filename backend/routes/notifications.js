const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, unreadOnly = false, status } = req.query;
    
    let query = { user: req.user._id };
    if (unreadOnly === 'true' || unreadOnly === true) {
      query.status = 'unread';
    } else if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, status: 'unread' });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', protect, async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      status: 'unread' 
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/notifications/settings
// @desc    Get notification settings
// @access  Private
router.get('/settings', protect, async (req, res, next) => {
  try {
    // In a real app, you'd fetch these from a UserSettings model or user.preferences
    // Mocking settings here based on the frontend structure
    const settings = {
      emailAlerts: true,
      pushNotifications: true,
      lowStockAlerts: true,
      overdueReminders: true,
      aiInsights: true,
      systemUpdates: false,
      marketingEmails: false,
      weeklyDigest: true
    };
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/settings
// @desc    Update notification settings
// @access  Private
router.put('/settings', protect, async (req, res, next) => {
  try {
    // In a real app, save to UserSettings model
    const settings = req.body;
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', protect, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, status: 'unread' },
      { status: 'read', readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/notifications/:id
// @desc    Get single notification
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'read', readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/:id/unread
// @desc    Mark notification as unread
// @access  Private
router.put('/:id/unread', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'unread', readAt: null },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/:id/archive
// @desc    Archive a notification
// @access  Private
router.put('/:id/archive', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'archived' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
