const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  kit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kit',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Can refer to User (for personalized recs) or Tournament (for event recs)
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['User', 'Tournament']
  },
  type: {
    type: String,
    enum: ['restock', 'personalized', 'replacement', 'inspection'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  predictedDemand: {
    type: Number,
    default: 0
  },
  quantityNeeded: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'ignored'],
    default: 'active'
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
  timestamps: true
});

// Indexes for quick lookups
recommendationSchema.index({ targetId: 1, targetModel: 1, status: 1 });
recommendationSchema.index({ type: 1, status: 1 });
recommendationSchema.index({ priority: 1, status: 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
