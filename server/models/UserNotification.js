const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
    // User and notification references
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        required: true
    },

    // Delivery status for each channel
    deliveryStatus: {
        inApp: {
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date },
            read: { type: Boolean, default: false },
            readAt: { type: Date },
            clicked: { type: Boolean, default: false },
            clickedAt: { type: Date }
        },
        email: {
            sent: { type: Boolean, default: false },
            sentAt: { type: Date },
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date },
            opened: { type: Boolean, default: false },
            openedAt: { type: Date },
            clicked: { type: Boolean, default: false },
            clickedAt: { type: Date }
        },
        sms: {
            sent: { type: Boolean, default: false },
            sentAt: { type: Date },
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date }
        },
        push: {
            sent: { type: Boolean, default: false },
            sentAt: { type: Date },
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date },
            opened: { type: Boolean, default: false },
            openedAt: { type: Date }
        }
    },

    // User preferences and actions
    isDismissed: {
        type: Boolean,
        default: false
    },
    dismissedAt: {
        type: Date
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date
    },

    // Metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Timestamps
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

// Indexes for performance
userNotificationSchema.index({ user: 1, 'deliveryStatus.inApp.read': 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, isDismissed: 1, isArchived: 1 });
userNotificationSchema.index({ notification: 1, user: 1 }, { unique: true });
userNotificationSchema.index({ user: 1, createdAt: -1 });
userNotificationSchema.index({ 'deliveryStatus.inApp.delivered': 1, createdAt: -1 });

// Pre-save middleware to update updatedAt
userNotificationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Instance method to mark as delivered
userNotificationSchema.methods.markAsDelivered = function(channel = 'inApp') {
    if (this.deliveryStatus[channel]) {
        this.deliveryStatus[channel].delivered = true;
        this.deliveryStatus[channel].deliveredAt = new Date();
    }
    return this.save();
};

// Instance method to mark as read
userNotificationSchema.methods.markAsRead = function() {
    this.deliveryStatus.inApp.read = true;
    this.deliveryStatus.inApp.readAt = new Date();
    return this.save();
};

// Instance method to mark as clicked
userNotificationSchema.methods.markAsClicked = function(channel = 'inApp') {
    if (this.deliveryStatus[channel]) {
        this.deliveryStatus[channel].clicked = true;
        this.deliveryStatus[channel].clickedAt = new Date();
    }
    return this.save();
};

// Instance method to dismiss
userNotificationSchema.methods.dismiss = function() {
    this.isDismissed = true;
    this.dismissedAt = new Date();
    return this.save();
};

// Instance method to archive
userNotificationSchema.methods.archive = function() {
    this.isArchived = true;
    this.archivedAt = new Date();
    return this.save();
};

// Virtual for is read
userNotificationSchema.virtual('isRead').get(function() {
    return this.deliveryStatus.inApp.read;
});

// Virtual for is delivered
userNotificationSchema.virtual('isDelivered').get(function() {
    return this.deliveryStatus.inApp.delivered;
});

// Virtual for is clicked
userNotificationSchema.virtual('isClicked').get(function() {
    return this.deliveryStatus.inApp.clicked;
});

// Static method to find unread notifications for a user
userNotificationSchema.statics.findUnreadForUser = function(userId, limit = 50) {
    return this.find({
        user: userId,
        'deliveryStatus.inApp.read': false,
        isDismissed: false,
        isArchived: false
    })
    .populate('notification')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find recent notifications for a user
userNotificationSchema.statics.findRecentForUser = function(userId, limit = 20) {
    return this.find({
        user: userId,
        isArchived: false
    })
    .populate('notification')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark all notifications as read for a user
userNotificationSchema.statics.markAllAsRead = function(userId) {
    return this.updateMany(
        {
            user: userId,
            'deliveryStatus.inApp.read': false,
            isDismissed: false,
            isArchived: false
        },
        {
            'deliveryStatus.inApp.read': true,
            'deliveryStatus.inApp.readAt': new Date()
        }
    );
};

// JSON transform to include virtuals
userNotificationSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('UserNotification', userNotificationSchema); 