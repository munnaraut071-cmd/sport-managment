const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Kit = require('../models/Kit');
const { protect, staffAndAdmin } = require('../middleware/auth');

// @route   GET /api/reservations
// @desc    Get all reservations
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query.status = status;

    // If not admin/staff, only show own reservations
    if (req.user.role === 'user') {
      query.user = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reservations = await Reservation.find(query)
      .populate('user', 'name email')
      .populate('kit', 'name category image')
      .populate('tournament', 'name startDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments(query);

    res.json({
      success: true,
      reservations,
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

// @route   GET /api/reservations/my-reservations
// @desc    Get current user's reservations
// @access  Private
router.get('/my-reservations', protect, async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('kit', 'name category image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reservations
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reservations
// @desc    Create a new reservation
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { kitId, startDate, endDate, quantity, purpose, tournamentId, priority } = req.body;

    // Check if kit exists and has availability
    const kit = await Kit.findById(kitId);
    if (!kit) {
      return res.status(404).json({ success: false, message: 'Kit not found' });
    }

    if (kit.available < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${kit.available} units available` 
      });
    }

    // Check for overlapping reservations
    const overlapping = await Reservation.findOne({
      kit: kitId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Kit is already reserved for these dates'
      });
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      kit: kitId,
      quantity,
      startDate,
      endDate,
      purpose,
      tournament: tournamentId || null,
      priority: priority || 'medium'
    });

    await reservation.populate('kit user');

    res.status(201).json({
      success: true,
      reservation
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reservations/:id/approve
// @desc    Approve a reservation
// @access  Private (Staff/Admin only)
router.post('/:id/approve', protect, staffAndAdmin, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Reservation is not pending' 
      });
    }

    // Check kit availability again
    const kit = await Kit.findById(reservation.kit);
    if (kit.available < reservation.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient kit availability'
      });
    }

    reservation.status = 'approved';
    reservation.approvedBy = req.user._id;
    reservation.approvedAt = new Date();
    await reservation.save();

    // Reserve the kit quantity
    kit.available -= reservation.quantity;
    await kit.save();

    await reservation.populate('kit user approvedBy');

    res.json({
      success: true,
      reservation
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reservations/:id/reject
// @desc    Reject a reservation
// @access  Private (Staff/Admin only)
router.post('/:id/reject', protect, staffAndAdmin, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Reservation is not pending' 
      });
    }

    reservation.status = 'rejected';
    reservation.rejectionReason = reason;
    reservation.approvedBy = req.user._id;
    await reservation.save();

    await reservation.populate('kit user');

    res.json({
      success: true,
      reservation
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reservations/:id/cancel
// @desc    Cancel a reservation
// @access  Private
router.post('/:id/cancel', protect, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Only allow user to cancel their own reservation (unless admin)
    if (reservation.user.toString() !== req.user._id.toString() && req.user.role === 'user') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['pending', 'approved'].includes(reservation.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel this reservation' 
      });
    }

    // If approved, return kit quantity to available
    if (reservation.status === 'approved') {
      const kit = await Kit.findById(reservation.kit);
      kit.available += reservation.quantity;
      await kit.save();
    }

    reservation.status = 'cancelled';
    await reservation.save();

    await reservation.populate('kit user');

    res.json({
      success: true,
      reservation
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Delete a reservation
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // If approved, return kit quantity
    if (reservation.status === 'approved') {
      const kit = await Kit.findById(reservation.kit);
      kit.available += reservation.quantity;
      await kit.save();
    }

    await reservation.deleteOne();

    res.json({
      success: true,
      message: 'Reservation deleted'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
