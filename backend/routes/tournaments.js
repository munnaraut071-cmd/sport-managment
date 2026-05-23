const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const Kit = require('../models/Kit');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendTournamentNotification } = require('../utils/notifications');

// @route   GET /api/tournaments
// @desc    Get all tournaments
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, upcoming } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
      query.status = { $in: ['draft', 'active'] };
    }
    
    const tournaments = await Tournament.find(query)
      .populate('reservedKits.kit', 'name category available')
      .populate('participants.user', 'name email')
      .populate('captain', 'name email')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: tournaments.length,
      data: tournaments
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tournaments/:id
// @desc    Get single tournament
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('reservedKits.kit', 'name category available')
      .populate('reservedKits.allocatedTo.user', 'name email')
      .populate('participants.user', 'name email')
      .populate('captain', 'name email')
      .populate('createdBy', 'name');
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    
    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tournaments
// @desc    Create new tournament
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { eventName, description, eventType, startDate, endDate, location, sport, reservedKits, priority, maxKitsPerUser } = req.body;
    
    // Validate kit availability
    for (const reserve of reservedKits || []) {
      const kit = await Kit.findById(reserve.kit);
      if (!kit) {
        return res.status(400).json({ success: false, message: `Kit not found: ${reserve.kit}` });
      }
      if (kit.available < reserve.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${kit.name}. Available: ${kit.available}, Required: ${reserve.quantity}` 
        });
      }
    }
    
    const tournament = await Tournament.create({
      eventName,
      description,
      eventType,
      startDate,
      endDate,
      reservedKits: reservedKits || [],
      priority: priority || 'medium',
      maxKitsPerUser: maxKitsPerUser || 3,
      createdBy: req.user.id,
      status: 'draft'
    });
    
    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/tournaments/:id
// @desc    Update tournament details
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { eventName, description, eventType, location, startDate, endDate, priority, status, sport } = req.body;
    
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    
    // Check authorization: admin or creator
    if (req.user.role !== 'admin' && tournament.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this tournament' });
    }
    
    // Apply updates
    if (eventName) tournament.eventName = eventName;
    if (description !== undefined) tournament.description = description;
    if (eventType || sport) tournament.eventType = eventType || sport || tournament.eventType;
    if (location !== undefined) tournament.location = location;
    if (startDate) tournament.startDate = startDate;
    if (endDate) tournament.endDate = endDate;
    if (priority) tournament.priority = priority;
    if (status) tournament.status = status;
    
    await tournament.save();
    
    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/tournaments/:id/activate
// @desc    Activate tournament and reserve kits
// @access  Admin
router.put('/:id/activate', adminOnly, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    
    if (tournament.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Tournament is already active or completed' });
    }
    
    // Reserve kits
    for (const reserve of tournament.reservedKits) {
      const kit = await Kit.findById(reserve.kit);
      if (kit) {
        if (kit.available < reserve.quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Cannot activate: ${kit.name} only has ${kit.available} available (need ${reserve.quantity})` 
          });
        }
        kit.available -= reserve.quantity;
        await kit.save();
      }
    }
    
    tournament.status = 'active';
    await tournament.save();
    
    // Notify participants if any
    for (const participant of tournament.participants) {
      const user = await User.findById(participant.user);
      if (user) {
        await sendTournamentNotification(user, tournament, 'upcoming');
      }
    }
    
    res.json({
      success: true,
      message: 'Tournament activated and kits reserved',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tournaments/:id/allocate
// @desc    Allocate kit to participant
// @access  Admin/Captain
router.post('/:id/allocate', protect, async (req, res, next) => {
  try {
    const { kitId, userId, quantity } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    
    // Check authorization (admin or captain)
    if (req.user.role !== 'admin' && tournament.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin or tournament captain can allocate kits' });
    }
    
    await tournament.allocateKit(kitId, userId, quantity || 1);
    
    // Notify user
    const user = await User.findById(userId);
    if (user) {
      await sendTournamentNotification(user, tournament, 'allocation');
    }
    
    res.json({
      success: true,
      message: 'Kit allocated successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tournaments/:id/participants
// @desc    Add participant to tournament
// @access  Admin/Captain
router.post('/:id/participants', protect, async (req, res, next) => {
  try {
    const { userId, role, team } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && tournament.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Check if already a participant
    const existing = tournament.participants.find(p => p.user.toString() === userId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User is already a participant' });
    }
    
    tournament.participants.push({
      user: userId,
      role: role || 'player',
      team
    });
    
    await tournament.save();
    
    res.json({
      success: true,
      message: 'Participant added successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/tournaments/:id/complete
// @desc    Complete tournament and release kits
// @access  Admin
router.put('/:id/complete', adminOnly, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    
    await tournament.releaseReservation();
    
    res.json({
      success: true,
      message: 'Tournament completed and kits released',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/tournaments/:id
// @desc    Delete tournament
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    
    // Check authorization: admin or creator
    if (req.user.role !== 'admin' && tournament.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this tournament' });
    }
    
    // Release kits if active
    if (tournament.status === 'active') {
      await tournament.releaseReservation();
    }
    
    await tournament.deleteOne();
    
    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
