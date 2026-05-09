const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  kit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kit',
    required: true
  },
  type: {
    type: String,
    enum: ['issue', 'return'],
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost', 'damaged'],
    default: 'active'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: function() {
      return this.type === 'issue';
    }
  },
  returnDate: {
    type: Date,
    default: null
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: null
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date,
    default: null
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

// Virtual for days overdue
transactionSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'active' || !this.dueDate) return 0;
  const today = new Date();
  const due = new Date(this.dueDate);
  if (today <= due) return 0;
  return Math.ceil((today - due) / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue check
transactionSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'active' || !this.dueDate) return false;
  return new Date() > new Date(this.dueDate);
});

// Pre-save middleware to update status
transactionSchema.pre('save', function(next) {
  if (this.isModified('returnDate') && this.returnDate) {
    this.status = 'returned';
  }
  if (this.isOverdue && this.status === 'active') {
    this.status = 'overdue';
  }
  next();
});

// Static method to find overdue transactions
transactionSchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    dueDate: { $lt: new Date() }
  }).populate('user', 'name email').populate('kit', 'name category');
};

// Static method to find active transactions by user
transactionSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['active', 'overdue'] }
  }).populate('kit', 'name category image');
};

// Static method to get user transaction history
transactionSchema.statics.getUserHistory = function(userId) {
  return this.find({ user: userId })
    .populate('kit', 'name category image')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);
