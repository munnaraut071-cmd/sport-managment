const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Kit = require('../models/Kit');
const Transaction = require('../models/Transaction');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/teams
// @desc    Get all teams
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { sport, myTeams } = req.query;
    let query = { status: 'active' };
    
    if (sport) query.sport = sport;
    if (myTeams === 'true') {
      query['members.user'] = req.user.id;
    }
    
    const teams = await Team.find(query)
      .populate('members.user', 'name email')
      .populate('captain', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/teams/:id
// @desc    Get single team
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('captain', 'name email')
      .populate('allocatedKits.kit', 'name category')
      .populate('allocatedKits.allocatedTo', 'name email');
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/teams
// @desc    Create new team
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, description, sport, maxGroupSize } = req.body;
    
    const team = await Team.create({
      name,
      description,
      sport,
      captain: req.user.id,
      maxGroupSize: maxGroupSize || 15,
      members: [{ user: req.user.id, role: 'captain' }],
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/teams/:id
// @desc    Update team
// @access  Captain/Admin
router.put('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only team captain can update team' });
    }
    
    const { name, description, sport, maxGroupSize, status } = req.body;
    
    if (name) team.name = name;
    if (description) team.description = description;
    if (sport && req.user.role === 'admin') team.sport = sport;
    if (maxGroupSize) team.maxGroupSize = maxGroupSize;
    if (status && req.user.role === 'admin') team.status = status;
    
    await team.save();
    
    res.json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/teams/:id/members
// @desc    Add member to team
// @access  Captain/Admin
router.post('/:id/members', protect, async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only team captain can add members' });
    }
    
    await team.addMember(userId, role || 'player');
    
    res.json({
      success: true,
      message: 'Member added successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/teams/:id/members/:userId
// @desc    Remove member from team
// @access  Captain/Admin
router.delete('/:id/members/:userId', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only team captain can remove members' });
    }
    
    await team.removeMember(req.params.userId);
    
    res.json({
      success: true,
      message: 'Member removed successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/teams/:id/transfer-captaincy
// @desc    Transfer team captaincy
// @access  Current Captain
router.post('/:id/transfer-captaincy', protect, async (req, res, next) => {
  try {
    const { newCaptainId } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Only current captain can transfer
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only current captain can transfer captaincy' });
    }
    
    await team.transferCaptaincy(newCaptainId);
    
    res.json({
      success: true,
      message: 'Captaincy transferred successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/teams/:id/bulk-allocate
// @desc    Bulk allocate kits to team members
// @access  Captain
router.post('/:id/bulk-allocate', protect, async (req, res, next) => {
  try {
    const { allocations } = req.body; // [{ kitId, userId, quantity }]
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Only captain can allocate
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only team captain can allocate kits' });
    }
    
    const results = await team.bulkAllocate(allocations, req.user.id);
    
    // Create actual transactions for successful allocations
    for (const success of results.successful) {
      await Transaction.create({
        user: success.userId,
        kit: success.kitId,
        type: 'issue',
        status: 'active',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }
    
    res.json({
      success: true,
      message: 'Bulk allocation completed',
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/teams/available
// @desc    Get available teams to join
// @access  Private
router.get('/available/list', protect, async (req, res, next) => {
  try {
    const { sport } = req.query;
    
    const teams = await Team.getAvailableTeams(sport);
    
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/teams/my-teams
// @desc    Get user's teams
// @access  Private
router.get('/user/my-teams', protect, async (req, res, next) => {
  try {
    const teams = await Team.getUserTeams(req.user.id);
    
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/teams/:id
// @desc    Delete team
// @access  Captain/Admin
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    if (req.user.role !== 'admin' && team.captain.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Return all allocated kits
    for (const alloc of team.allocatedKits) {
      if (alloc.status === 'allocated') {
        const kit = await Kit.findById(alloc.kit);
        if (kit) {
          kit.available += alloc.quantity;
          await kit.save();
        }
      }
    }
    
    await team.deleteOne();
    
    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
