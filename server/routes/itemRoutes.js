const express = require('express');
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const upload = require('../config/multer');
const AIPredictor = require('../utils/AIPredictor');
const { protect, authorize, isSupervisor } = require('../middleware/auth');

const router = express.Router();

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// ============ GET ROUTES ============

// Get all items (with optional predictions)
router.get('/', protect, async (req, res) => {
  try {
    const { category, active, withPredictions } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (active !== undefined) query.active = active === 'true';
    
    const items = await Item.find(query).sort({ createdAt: -1 });
    
    if (withPredictions === 'true') {
      const itemsWithPredictions = items.map(item => ({
        ...item.toObject(),
        aiPrediction: {
          predictedDemand: AIPredictor.predictItemDemand(item),
          urgency: AIPredictor.getUrgencyLevel(item),
          trendingScore: AIPredictor.calculateTrendingScore(item)
        }
      }));
      
      return res.status(200).json({
        success: true,
        count: itemsWithPredictions.length,
        data: itemsWithPredictions
      });
    }
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get items needing reorder
router.get('/reorder/check', async (req, res) => {
  try {
    const items = await Item.find();
    const reorderItems = items.filter(item => item.needsReorder());
    
    res.status(200).json({
      success: true,
      count: reorderItems.length,
      data: reorderItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get inventory summary
router.get('/summary/dashboard', async (req, res) => {
  try {
    const items = await Item.find();
    
    const summary = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalIssued: items.reduce((sum, item) => sum + item.issued, 0),
      totalDamaged: items.reduce((sum, item) => sum + item.damaged, 0),
      totalLost: items.reduce((sum, item) => sum + item.lost, 0),
      totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
      categories: {},
      reorderNeeded: items.filter(item => item.needsReorder()).length
    };
    
    // Group by category
    items.forEach(item => {
      if (!summary.categories[item.category]) {
        summary.categories[item.category] = {
          count: 0,
          quantity: 0,
          issued: 0
        };
      }
      summary.categories[item.category].count++;
      summary.categories[item.category].quantity += item.quantity;
      summary.categories[item.category].issued += item.issued;
    });
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ POST ROUTES ============

// Create new item
router.post('/', [
  body('name').trim().notEmpty().withMessage('Kit name is required'),
  body('category').isIn(['Cricket', 'Football', 'Badminton', 'Basketball', 'Volleyball', 'Tennis', 'Hockey', 'Other']).withMessage('Invalid category'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Issue kit (reduce quantity)
router.post('/:id/issue', [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('studentId').optional().trim(),
  body('remarks').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    await item.issueKit(req.body.quantity);
    
    res.status(200).json({
      success: true,
      message: `${req.body.quantity} kit(s) issued successfully`,
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Return kit
router.post('/:id/return', [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('isDamaged').optional().isBoolean(),
  body('remarks').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    await item.returnKit(req.body.quantity, req.body.isDamaged || false);
    
    res.status(200).json({
      success: true,
      message: `${req.body.quantity} kit(s) returned successfully`,
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ============ PUT ROUTES ============

// Update item
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ============ DELETE ROUTES ============

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ IMAGE UPLOAD ============

// Upload kit image
router.post('/:id/upload-image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Store image URL
    item.imageUrl = `/uploads/${req.file.filename}`;
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        itemId: item._id,
        imageUrl: item.imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ AI PREDICTION ROUTES ============

// Get AI predictions for single item
router.get('/:id/ai-prediction', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const predictedDemand = AIPredictor.predictItemDemand(item);
    const urgency = AIPredictor.getUrgencyLevel(item);
    const trendingScore = AIPredictor.calculateTrendingScore(item);

    res.status(200).json({
      success: true,
      data: {
        itemId: item._id,
        name: item.name,
        category: item.category,
        baseDemand: item.baseDemand,
        predictedDemand,
        currentStock: item.quantity - item.issued,
        urgency,
        trendingScore,
        needsReorder: item.needsReorder()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
