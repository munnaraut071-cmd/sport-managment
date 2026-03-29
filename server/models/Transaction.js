const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['issue', 'return', 'damage', 'loss', 'restock'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemName: String,
  category: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  studentId: String,
  isDamaged: {
    type: Boolean,
    default: false
  },
  isLost: {
    type: Boolean,
    default: false
  },
  remarks: String,
  location: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
transactionSchema.index({ itemId: 1, timestamp: -1 });
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ type: 1, timestamp: -1 });
transactionSchema.index({ timestamp: -1 });

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function() {
  const typeLabels = {
    issue: 'Kit Issued',
    return: 'Kit Returned',
    damage: 'Damage Reported',
    loss: 'Item Lost',
    restock: 'Restocked'
  };
  
  return {
    id: this._id,
    actionType: typeLabels[this.type] || this.type,
    item: this.itemName,
    quantity: this.quantity,
    performedBy: this.userName,
    timestamp: this.timestamp,
    details: `${this.quantity} ${this.itemName} - ${typeLabels[this.type] || this.type}`
  };
});

module.exports = mongoose.model('Transaction', transactionSchema);
