const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Hockey', 'Volleyball', 'Table Tennis', 'Other']
  },
  // Team members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['captain', 'vice_captain', 'player', 'manager', 'coach'],
      default: 'player'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Team leader (captain)
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Group booking settings
  maxGroupSize: {
    type: Number,
    default: 15
  },
  // Bulk kit allocation
  allocatedKits: [{
    kit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kit'
    },
    quantity: {
      type: Number,
      default: 1
    },
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    allocatedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['allocated', 'returned', 'overdue'],
      default: 'allocated'
    }
  }],
  // Team statistics
  stats: {
    totalIssues: {
      type: Number,
      default: 0
    },
    totalReturns: {
      type: Number,
      default: 0
    },
    lateReturns: {
      type: Number,
      default: 0
    },
    averageReturnTime: {
      type: Number,
      default: 0
    }
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'disbanded'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for active allocations
teamSchema.virtual('activeAllocations').get(function() {
  return this.allocatedKits.filter(a => a.status === 'allocated').length;
});

// Method to add member
teamSchema.methods.addMember = async function(userId, role = 'player') {
  // Check if already a member
  const existing = this.members.find(m => m.user.toString() === userId.toString());
  if (existing) {
    throw new Error('User is already a team member');
  }
  
  // Check team size limit
  if (this.members.length >= this.maxGroupSize) {
    throw new Error(`Team is at maximum capacity (${this.maxGroupSize})`);
  }
  
  this.members.push({
    user: userId,
    role,
    joinedAt: new Date()
  });
  
  await this.save();
  return this;
};

// Method to remove member
teamSchema.methods.removeMember = async function(userId) {
  // Cannot remove captain
  if (this.captain.toString() === userId.toString()) {
    throw new Error('Cannot remove team captain. Transfer captaincy first.');
  }
  
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  
  // Remove any kit allocations for this member
  this.allocatedKits = this.allocatedKits.filter(a => 
    !(a.allocatedTo && a.allocatedTo.toString() === userId.toString())
  );
  
  await this.save();
  return this;
};

// Method to transfer captaincy
teamSchema.methods.transferCaptaincy = async function(newCaptainId) {
  // Verify new captain is a team member
  const isMember = this.members.some(m => m.user.toString() === newCaptainId.toString());
  if (!isMember) {
    throw new Error('New captain must be a team member');
  }
  
  this.captain = newCaptainId;
  
  // Update member roles
  this.members = this.members.map(m => {
    if (m.user.toString() === newCaptainId.toString()) {
      return { ...m.toObject(), role: 'captain' };
    }
    if (m.role === 'captain') {
      return { ...m.toObject(), role: 'player' };
    }
    return m;
  });
  
  await this.save();
  return this;
};

// Method for bulk kit allocation (group booking)
teamSchema.methods.bulkAllocate = async function(allocations, captainId) {
  // Only captain or admin can allocate
  if (this.captain.toString() !== captainId.toString()) {
    throw new Error('Only team captain can allocate kits');
  }
  
  const Kit = mongoose.model('Kit');
  const results = {
    successful: [],
    failed: []
  };
  
  for (const alloc of allocations) {
    try {
      // Check kit availability
      const kit = await Kit.findById(alloc.kitId);
      if (!kit || kit.available < alloc.quantity) {
        results.failed.push({
          kitId: alloc.kitId,
          reason: 'Insufficient stock'
        });
        continue;
      }
      
      // Check if user is team member
      const isMember = this.members.some(m => m.user.toString() === alloc.userId.toString());
      if (!isMember) {
        results.failed.push({
          kitId: alloc.kitId,
          userId: alloc.userId,
          reason: 'User is not a team member'
        });
        continue;
      }
      
      // Allocate kit
      kit.available -= alloc.quantity;
      await kit.save();
      
      this.allocatedKits.push({
        kit: alloc.kitId,
        quantity: alloc.quantity,
        allocatedTo: alloc.userId,
        status: 'allocated'
      });
      
      results.successful.push({
        kitId: alloc.kitId,
        userId: alloc.userId,
        quantity: alloc.quantity
      });
      
    } catch (error) {
      results.failed.push({
        kitId: alloc.kitId,
        reason: error.message
      });
    }
  }
  
  await this.save();
  return results;
};

// Static method to get teams by sport
teamSchema.statics.getBySport = function(sport) {
  return this.find({ sport, status: 'active' })
    .populate('members.user', 'name email')
    .populate('captain', 'name email');
};

// Static method to get user's teams
teamSchema.statics.getUserTeams = async function(userId) {
  return this.find({
    'members.user': userId,
    status: 'active'
  }).populate('captain', 'name email');
};

// Static method to get available teams for joining
teamSchema.statics.getAvailableTeams = function(sport) {
  const query = { status: 'active' };
  if (sport) query.sport = sport;
  
  return this.find(query)
    .populate('captain', 'name')
    .populate('members.user', 'name')
    .then(teams => teams.filter(t => t.members.length < t.maxGroupSize));
};

module.exports = mongoose.model('Team', teamSchema);
