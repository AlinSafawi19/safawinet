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
      enum: ['users']
    },
    actions: [{
      type: String,
      enum: ['view', 'add', 'edit', 'delete']
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

module.exports = mongoose.model('RoleTemplate', roleTemplateSchema); 