const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Kit = require('../models/Kit');
const { protect, adminOnly } = require('../middleware/auth');
const QRCode = require('qrcode');

// @route   GET /api/kits
// @desc    Get all kits
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { category, status, search, withPredictions, all } = req.query;
    let query = {};

    // Default to only showing active kits unless 'all=true' or specific status requested
    if (all === 'true') {
      // Show all kits
    } else if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // Default: only show working/active kits
    }

    if (category) query.category = category;
    if (withPredictions === 'true') {
      query.aiPrediction = { $in: ['high', 'medium'] };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const kits = await Kit.find(query).sort({ createdAt: -1 });
    
    // Log for debugging
    console.log(`[Kits API] Returning ${kits.length} kits with query:`, query);

    res.json({
      success: true,
      count: kits.length,
      data: kits
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/kits/:id
// @desc    Get single kit
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const kit = await Kit.findById(req.params.id);

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Kit not found'
      });
    }

    res.json({
      success: true,
      data: kit
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/kits
// @desc    Create new kit
// @access  Admin
router.post('/', adminOnly, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const kit = await Kit.create(req.body);

    // Generate QR code
    const qrData = JSON.stringify({ kitId: kit._id, name: kit.name });
    const qrCode = await QRCode.toDataURL(qrData);
    kit.qrCode = qrCode;
    await kit.save();

    // Notify admins about new kit
    const io = req.app.get('io');
    io.to('admin').emit('new_kit', {
      kitId: kit._id,
      name: kit.name,
      message: `New kit added: ${kit.name}`
    });

    res.status(201).json({
      success: true,
      data: kit
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/kits/:id
// @desc    Update kit
// @access  Admin
router.put('/:id', adminOnly, async (req, res, next) => {
  try {
    let kit = await Kit.findById(req.params.id);

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Kit not found'
      });
    }

    kit = await Kit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: kit
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/kits/:id
// @desc    Delete kit
// @access  Admin
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const kit = await Kit.findById(req.params.id);

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Kit not found'
      });
    }

    await kit.deleteOne();

    res.json({
      success: true,
      message: 'Kit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/kits/:id/qr
// @desc    Get QR code for kit
// @access  Private
router.get('/:id/qr', async (req, res, next) => {
  try {
    const kit = await Kit.findById(req.params.id);

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Kit not found'
      });
    }

    // Generate QR code
    const qrData = JSON.stringify({ kitId: kit._id, name: kit.name });
    const qrCode = await QRCode.toDataURL(qrData);

    res.json({
      success: true,
      data: { qrCode, kitId: kit._id }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/kits/low-stock
// @desc    Get low stock kits
// @access  Private
router.get('/alerts/low-stock', async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const kits = await Kit.findLowStock(threshold);

    res.json({
      success: true,
      count: kits.length,
      data: kits
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
