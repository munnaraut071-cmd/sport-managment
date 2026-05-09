const mongoose = require('mongoose');

const kitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kit name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Cricket', 'Football', 'Badminton', 'Basketball', 'Tennis', 'Hockey', 'Volleyball', 'Table Tennis', 'Other']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  available: {
    type: Number,
    default: function() {
      return this.quantity;
    },
    min: [0, 'Available cannot be negative']
  },
  image: {
    type: String,
    default: null
  },
  qrCode: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'retired'],
    default: 'active'
  },
  aiPrediction: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  predictedDemand: {
    type: Number,
    default: 0
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for availability percentage
kitSchema.virtual('availabilityPercent').get(function() {
  if (this.quantity === 0) return 0;
  return Math.round((this.available / this.quantity) * 100);
});

// Virtual for issued count
kitSchema.virtual('issued').get(function() {
  return this.quantity - this.available;
});

// Pre-save middleware to ensure available doesn't exceed quantity
kitSchema.pre('save', function(next) {
  if (this.available > this.quantity) {
    this.available = this.quantity;
  }
  next();
});

// Method to check if kit is in stock
kitSchema.methods.isInStock = function() {
  return this.available > 0;
};

// Method to issue kit (atomic operation)
kitSchema.methods.issue = function(quantity = 1) {
  // Use findOneAndUpdate to ensure atomicity and avoid cast errors on the filter
  return mongoose.model('Kit').findOneAndUpdate(
    { 
      _id: this._id,
      available: { $gte: quantity }
    },
    { 
      $inc: { available: -quantity }
    },
    { new: true }
  ).then(updatedKit => {
    if (!updatedKit) {
      throw new Error('Insufficient stock or kit not found');
    }
    return updatedKit;
  });
};

// Method to return kit (atomic operation)
kitSchema.methods.return = function(quantity = 1) {
  return mongoose.model('Kit').findOneAndUpdate(
    { _id: this._id },
    { $inc: { available: quantity } },
    { new: true }
  ).then(updatedKit => {
    if (!updatedKit) {
      throw new Error('Kit not found');
    }
    return updatedKit;
  });
};

// Helper method to refresh the document after update
kitSchema.methods.refresh = async function() {
  return this.constructor.findById(this._id);
};

// Static method to find low stock items
kitSchema.statics.findLowStock = function(threshold = 5) {
  return this.find({
    $expr: { $lte: ['$available', threshold] },
    status: 'active'
  });
};

// Create indexes for performance
kitSchema.index({ category: 1 });
kitSchema.index({ status: 1 });
kitSchema.index({ available: 1 });
kitSchema.index({ quantity: 1 });
kitSchema.index({ aiPrediction: 1 });
kitSchema.index({ createdAt: -1 });
kitSchema.index({ name: 'text', description: 'text' }); // For search

module.exports = mongoose.model('Kit', kitSchema);
