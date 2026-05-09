const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  kit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kit',
    required: true
  },
  // Fine calculation
  daysLate: {
    type: Number,
    required: true,
    min: 0
  },
  finePerDay: {
    type: Number,
    default: 10 // ₹10 per day
  },
  fineAmount: {
    type: Number,
    required: true
  },
  // Fine status
  status: {
    type: String,
    enum: ['pending', 'paid', 'waived', 'disputed'],
    default: 'pending'
  },
  // Payment details
  payment: {
    method: {
      type: String,
      enum: ['cash', 'online', 'upi', 'card', null],
      default: null
    },
    transactionId: String,
    paidAt: Date,
    paidAmount: Number
  },
  // Fine rules applied
  fineRules: {
    baseRate: Number,
    maxCap: Number,      // Maximum fine amount
    damageCharges: Number,
    processingFee: Number
  },
  // Waive details (if applicable)
  waive: {
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    },
    waivedAt: Date,
    reason: String,
    waivedAmount: Number
  },
  // Dispute details
  dispute: {
    raisedAt: Date,
    reason: String,
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'rejected'],
      default: 'open'
    },
    resolvedAt: Date,
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Reminders sent
  remindersSent: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'app']
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Notes
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for total amount (fine + any additional charges)
fineSchema.virtual('totalAmount').get(function() {
  return this.fineAmount + 
    (this.fineRules?.damageCharges || 0) + 
    (this.fineRules?.processingFee || 0);
});

// Virtual for outstanding amount
fineSchema.virtual('outstandingAmount').get(function() {
  if (this.status === 'paid') return 0;
  if (this.status === 'waived') {
    return this.totalAmount - (this.waive?.waivedAmount || 0);
  }
  return this.totalAmount;
});

// Pre-save hook to calculate fine amount
fineSchema.pre('save', function(next) {
  if (this.isModified('daysLate') || this.isModified('finePerDay')) {
    // Base fine calculation
    let amount = this.daysLate * this.finePerDay;
    
    // Apply maximum cap (if configured)
    if (this.fineRules?.maxCap && amount > this.fineRules.maxCap) {
      amount = this.fineRules.maxCap;
    }
    
    this.fineAmount = amount;
  }
  next();
});

// Method to record payment
fineSchema.methods.recordPayment = async function(paymentData) {
  this.status = 'paid';
  this.payment = {
    method: paymentData.method,
    transactionId: paymentData.transactionId,
    paidAt: new Date(),
    paidAmount: paymentData.amount || this.totalAmount
  };
  
  await this.save();
  return this;
};

// Method to waive fine
fineSchema.methods.waiveFine = async function(waiveData) {
  this.status = 'waived';
  this.waive = {
    waivedBy: waiveData.waivedBy,
    waivedAt: new Date(),
    reason: waiveData.reason,
    waivedAmount: waiveData.amount || this.fineAmount
  };
  
  await this.save();
  return this;
};

// Method to raise dispute
fineSchema.methods.raiseDispute = async function(disputeData) {
  this.status = 'disputed';
  this.dispute = {
    raisedAt: new Date(),
    reason: disputeData.reason,
    status: 'open'
  };
  
  await this.save();
  return this;
};

// Static method to calculate fine for a late return
fineSchema.statics.calculateFine = function(daysLate, baseRate = 10) {
  // Progressive fine calculation
  let fine = 0;
  
  if (daysLate <= 0) return 0;
  
  // First 3 days: base rate
  if (daysLate <= 3) {
    fine = daysLate * baseRate;
  }
  // Days 4-7: 1.5x rate
  else if (daysLate <= 7) {
    fine = (3 * baseRate) + ((daysLate - 3) * baseRate * 1.5);
  }
  // Days 8+: 2x rate (with max cap of 30 days worth)
  else {
    fine = (3 * baseRate) + (4 * baseRate * 1.5) + (Math.min(daysLate - 7, 23) * baseRate * 2);
  }
  
  // Maximum cap: 30 days worth of fines
  const maxFine = 30 * baseRate * 2;
  return Math.min(Math.round(fine), maxFine);
};

// Static method to get user's total outstanding fines
fineSchema.statics.getUserOutstanding = async function(userId) {
  const fines = await this.find({
    user: userId,
    status: { $in: ['pending', 'disputed'] }
  });
  
  const total = fines.reduce((sum, fine) => sum + fine.outstandingAmount, 0);
  
  return {
    totalOutstanding: total,
    fineCount: fines.length,
    fines: fines
  };
};

// Static method to get fine statistics
fineSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$fineAmount' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    totalAmount: 0,
    byStatus: {}
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    result.totalAmount += stat.totalAmount;
    result.byStatus[stat._id] = {
      count: stat.count,
      amount: stat.totalAmount
    };
  });
  
  return result;
};

module.exports = mongoose.model('Fine', fineSchema);
