const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Basic notification info
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    type: {
        type: String,
        required: true,
        enum: ['info', 'success', 'warning', 'error', 'security', 'system', 'user', 'email', 'sms'],
        default: 'info'
    },
    category: {
        type: String,
        required: true,
        enum: ['security', 'system', 'user', 'email', 'sms', 'audit', 'login', 'password', 'profile', 'admin', 'general'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Targeting
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    targetRoles: [{
        type: String
    }],
    targetGroups: [{
        type: String
    }],
    isGlobal: {
        type: Boolean,
        default: false
    },

    // Delivery channels
    channels: [{
        type: String,
        enum: ['in_app', 'email', 'sms', 'push'],
        default: ['in_app']
    }],

    // Content and styling
    icon: {
        type: String,
        default: 'info'
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    actionUrl: {
        type: String,
        trim: true
    },
    actionText: {
        type: String,
        trim: true
    },

    // Scheduling
    scheduledFor: {
        type: Date
    },
    expiresAt: {
        type: Date
    },

    // Status tracking
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'active', 'sent', 'failed', 'cancelled'],
        default: 'draft'
    },

    // Delivery tracking
    deliveryStatus: {
        inApp: {
            sent: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
            read: { type: Number, default: 0 }
        },
        email: {
            sent: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
            opened: { type: Number, default: 0 },
            clicked: { type: Number, default: 0 }
        },
        sms: {
            sent: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 }
        }
    },

    // Metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Created by
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    sentAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
notificationSchema.index({ targetUsers: 1, status: 1, createdAt: -1 });
notificationSchema.index({ isGlobal: 1, status: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1, status: 1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ createdAt: -1 });

// Pre-save middleware to update updatedAt
notificationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to create system notification
notificationSchema.statics.createSystemNotification = function(data) {
    return this.create({
        ...data,
        createdBy: data.createdBy || null,
        type: 'system',
        category: 'system',
        isGlobal: true
    });
};

// Static method to create security notification
notificationSchema.statics.createSecurityNotification = function(data) {
    return this.create({
        ...data,
        type: 'security',
        category: 'security',
        priority: 'high'
    });
};

// Instance method to mark as sent
notificationSchema.methods.markAsSent = function() {
    this.status = 'sent';
    this.sentAt = new Date();
    return this.save();
};

// Instance method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel, status, count = 1) {
    if (this.deliveryStatus[channel] && this.deliveryStatus[channel][status] !== undefined) {
        this.deliveryStatus[channel][status] += count;
    }
    return this.save();
};

// Virtual for total delivery count
notificationSchema.virtual('totalDelivered').get(function() {
    let total = 0;
    Object.values(this.deliveryStatus).forEach(channel => {
        Object.values(channel).forEach(count => {
            total += count;
        });
    });
    return total;
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
    return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for is scheduled
notificationSchema.virtual('isScheduled').get(function() {
    return this.scheduledFor && new Date() < this.scheduledFor;
});

// JSON transform to include virtuals
notificationSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Notification', notificationSchema); 