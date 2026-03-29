const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide kit name'],
      trim: true,
      maxlength: [100, 'Kit name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['Cricket', 'Football', 'Badminton', 'Basketball', 'Volleyball', 'Tennis', 'Hockey', 'Other'],
      required: true
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      default: 0,
      min: 0
    },
    issued: {
      type: Number,
      default: 0,
      min: 0
    },
    returned: {
      type: Number,
      default: 0,
      min: 0
    },
    damaged: {
      type: Number,
      default: 0,
      min: 0
    },
    lost: {
      type: Number,
      default: 0,
      min: 0
    },
    baseDemand: {
      type: Number,
      default: 10,
      description: 'Base demand for AI predictions'
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    imageUrl: {
      type: String,
      default: 'https://via.placeholder.com/300'
    },
    reorderLevel: {
      type: Number,
      default: 5,
      description: 'Minimum stock level to trigger reorder alert'
    },
    supplier: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Store'
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor'],
      default: 'Good'
    },
    lastRestockDate: {
      type: Date,
      default: Date.now
    },
    aiPredictedDemand: {
      type: Number,
      default: 0,
      description: 'AI-predicted demand multiplier'
    },
    tags: [String],
    active: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    collection: 'sports_kits'
  }
);

// Calculate available quantity
itemSchema.virtual('available').get(function() {
  return this.quantity - this.issued;
});

// Method to update stock after issue
itemSchema.methods.issueKit = function(qty = 1) {
  if (this.available >= qty) {
    this.issued += qty;
    return this.save();
  }
  throw new Error('Insufficient stock available');
};

// Method to update stock after return
itemSchema.methods.returnKit = function(qty = 1, isDamaged = false) {
  if (this.issued >= qty) {
    this.issued -= qty;
    if (isDamaged) {
      this.damaged += qty;
    } else {
      this.returned += qty;
    }
    return this.save();
  }
  throw new Error('Cannot return more items than issued');
};

// Method to check if reorder needed
itemSchema.methods.needsReorder = function() {
  return this.available <= this.reorderLevel;
};

// Middleware to ensure issued doesn't exceed quantity
itemSchema.pre('save', function(next) {
  if (this.issued > this.quantity) {
    this.issued = this.quantity;
  }
  next();
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
