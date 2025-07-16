const mongoose = require('mongoose');

const roleTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  icon: {
    type: String,
    default: 'FiSettings'
  },
  color: {
    type: String,
    default: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  permissions: [{
    page: {
      type: String,
      required: true,
      enum: ['users', 'audit-logs']
    },
    actions: [{
      type: String,
      enum: ['view', 'view_own', 'add', 'edit', 'delete', 'export']
    }]
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
roleTemplateSchema.index({ name: 1 });
roleTemplateSchema.index({ isActive: 1 });
roleTemplateSchema.index({ createdBy: 1 });
roleTemplateSchema.index({ createdAt: -1 }); // For pagination
roleTemplateSchema.index({ isDefault: 1, isActive: 1 }); // For filtering
roleTemplateSchema.index({ usageCount: -1 }); // For sorting by usage

// Method to increment usage count
roleTemplateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Method to check if template can be deleted
roleTemplateSchema.methods.canBeDeleted = function() {
  return !this.isDefault && this.usageCount === 0;
};

// Static method to get default templates
roleTemplateSchema.statics.getDefaultTemplates = function() {
  return this.find({ isDefault: true, isActive: true }).sort({ name: 1 });
};

// Static method to get active templates
roleTemplateSchema.statics.getActiveTemplates = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method for paginated templates with filtering and sorting
roleTemplateSchema.statics.getPaginatedTemplates = function(options = {}) {
  const {
    page = 1,
    limit = 10,
    status = 'all', // 'all', 'active', 'inactive', 'default'
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Build query
  let query = {};

  // Status filter
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  } else if (status === 'default') {
    query.isDefault = true;
    query.isActive = true;
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate skip value
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('createdBy', 'username firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get total count for pagination
roleTemplateSchema.statics.getTemplatesCount = function(options = {}) {
  const {
    status = 'all',
    search = ''
  } = options;

  // Build query (same as getPaginatedTemplates)
  let query = {};

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  } else if (status === 'default') {
    query.isDefault = true;
    query.isActive = true;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  return this.countDocuments(query);
};

// Static method for paginated templates with user-specific filtering
roleTemplateSchema.statics.getPaginatedTemplatesForUser = function(options = {}) {
  const {
    page = 1,
    limit = 10,
    status = 'all', // 'all', 'active', 'inactive', 'default'
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    userId
  } = options;

  // Build query with user-specific filtering
  let query = {
    $or: [
      { isDefault: true }, // Show default templates
      { createdBy: userId } // Show templates created by the user
    ]
  };

  // Status filter
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  } else if (status === 'default') {
    query = {
      isDefault: true,
      isActive: true
    };
  }

  // Search filter
  if (search) {
    const searchQuery = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    };
    
    // Combine with existing query
    query = {
      $and: [query, searchQuery]
    };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate skip value
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('createdBy', 'username firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get total count for pagination with user-specific filtering
roleTemplateSchema.statics.getTemplatesCountForUser = function(options = {}) {
  const {
    status = 'all',
    search = '',
    userId
  } = options;

  // Build query with user-specific filtering (same as getPaginatedTemplatesForUser)
  let query = {
    $or: [
      { isDefault: true }, // Show default templates
      { createdBy: userId } // Show templates created by the user
    ]
  };

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  } else if (status === 'default') {
    query = {
      isDefault: true,
      isActive: true
    };
  }

  if (search) {
    const searchQuery = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    };
    
    // Combine with existing query
    query = {
      $and: [query, searchQuery]
    };
  }

  return this.countDocuments(query);
};

// Static method to check for duplicate name within user scope
roleTemplateSchema.statics.checkDuplicateNameInUserScope = function(name, userId, excludeId = null) {
  let query = {
    name: name.trim(),
    isActive: true,
    $or: [
      { isDefault: true }, // Check against default templates
      { createdBy: userId } // Check against user's own templates
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.findOne(query);
};

// Static method to check for duplicate permissions within user scope
roleTemplateSchema.statics.checkDuplicatePermissionsInUserScope = function(permissions, userId, excludeId = null) {
  let query = {
    isActive: true,
    $or: [
      { isDefault: true }, // Include default templates
      { createdBy: userId } // Include user's own templates
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query).then(templates => {
    for (const template of templates) {
      if (arePermissionsIdentical(template.permissions, permissions)) {
        return template;
      }
    }
    return null;
  });
};

// Helper function to check if permissions are identical (moved from routes)
const arePermissionsIdentical = (permissions1, permissions2) => {
  if (!permissions1 || !permissions2) return false;
  if (permissions1.length !== permissions2.length) return false;

  // Sort both permission arrays for comparison
  const sortPermissions = (perms) => {
    return perms.map(p => ({
      page: p.page,
      actions: p.actions ? [...p.actions].sort() : []
    })).sort((a, b) => a.page.localeCompare(b.page));
  };

  const sorted1 = sortPermissions(permissions1);
  const sorted2 = sortPermissions(permissions2);

  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
};

module.exports = mongoose.model('RoleTemplate', roleTemplateSchema); 