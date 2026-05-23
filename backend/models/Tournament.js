const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['inter-college', 'intra-college', 'internal', 'inter-department', 'state-level', 'national-level', 'sports-day', 'practice', 'friendly', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Ground'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  // Reserved kits for tournament
  reservedKits: [{
    kit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kit',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    allocatedTo: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      quantity: Number,
      allocatedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // Team/participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['captain', 'player', 'manager'],
      default: 'player'
    },
    team: String
  }],
  // Priority settings
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Bulk booking settings
  bulkBookingEnabled: {
    type: Boolean,
    default: true
  },
  maxKitsPerUser: {
    type: Number,
    default: 3
  },
  // AI predictions
  predictedDemand: {
    type: Number,
    default: 0
  },
  actualUsage: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for total reserved quantity
tournamentSchema.virtual('totalReserved').get(function() {
  return this.reservedKits.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for total allocated
tournamentSchema.virtual('totalAllocated').get(function() {
  return this.reservedKits.reduce((sum, item) => {
    return sum + (item.allocatedTo ? item.allocatedTo.reduce((a, alloc) => a + alloc.quantity, 0) : 0);
  }, 0);
});

// Virtual for available quantity
tournamentSchema.virtual('availableToAllocate').get(function() {
  return this.totalReserved - this.totalAllocated;
});

// Check if tournament is upcoming
tournamentSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date() && this.status === 'active';
});

// Check if tournament is ongoing
tournamentSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate && this.status === 'active';
});

// Pre-save hook to reserve kits in inventory
tournamentSchema.pre('save', async function(next) {
  if (this.isModified('reservedKits') && this.status === 'active') {
    const Kit = mongoose.model('Kit');
    
    for (const reserve of this.reservedKits) {
      const kit = await Kit.findById(reserve.kit);
      if (kit) {
        // Check if enough stock available
        if (kit.available < reserve.quantity) {
          throw new Error(`Insufficient stock for ${kit.name}. Available: ${kit.available}, Required: ${reserve.quantity}`);
        }
        // Temporarily reduce available quantity
        kit.available -= reserve.quantity;
        await kit.save();
      }
    }
  }
  next();
});

// Method to allocate kit to participant
tournamentSchema.methods.allocateKit = async function(kitId, userId, quantity) {
  const reserve = this.reservedKits.find(r => r.kit.toString() === kitId.toString());
  
  if (!reserve) {
    throw new Error('Kit not reserved for this tournament');
  }
  
  const currentlyAllocated = reserve.allocatedTo.reduce((sum, alloc) => sum + alloc.quantity, 0);
  const available = reserve.quantity - currentlyAllocated;
  
  if (quantity > available) {
    throw new Error(`Only ${available} units available for allocation`);
  }
  
  // Check user's existing allocation
  const userExistingAlloc = reserve.allocatedTo.find(a => a.user.toString() === userId.toString());
  const userTotalKits = this.reservedKits.reduce((sum, r) => {
    const userAlloc = r.allocatedTo.find(a => a.user.toString() === userId.toString());
    return sum + (userAlloc ? userAlloc.quantity : 0);
  }, 0);
  
  if (userTotalKits + quantity > this.maxKitsPerUser) {
    throw new Error(`Cannot allocate more than ${this.maxKitsPerUser} kits per user`);
  }
  
  if (userExistingAlloc) {
    userExistingAlloc.quantity += quantity;
  } else {
    reserve.allocatedTo.push({ user: userId, quantity });
  }
  
  await this.save();
  return this;
};

// Method to release reservation after tournament
tournamentSchema.methods.releaseReservation = async function() {
  const Kit = mongoose.model('Kit');
  
  for (const reserve of this.reservedKits) {
    const kit = await Kit.findById(reserve.kit);
    if (kit) {
      // Return reserved quantity to inventory
      kit.available += reserve.quantity;
      await kit.save();
    }
  }
  
  this.status = 'completed';
  await this.save();
  return this;
};

// Static method to get upcoming tournaments

tournamentSchema.statics.getUpcoming = function() {
  return this.find({
    startDate: { $gte: new Date() },
    status: { $in: ['draft', 'active'] }
  }).populate('reservedKits.kit', 'name category').sort({ startDate: 1 });
};

// Static method to get active tournaments
tournamentSchema.statics.getActive = function() {
  const now = new Date();
  return this.find({
    startDate: { $lte: now },
    endDate: { $gte: now },
    status: 'active'
  }).populate('reservedKits.kit', 'name category');
};

module.exports = mongoose.model('Tournament', tournamentSchema);
