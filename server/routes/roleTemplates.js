const express = require('express');
const RoleTemplate = require('../models/RoleTemplate');
const { authenticateToken, requireAdmin, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Helper function to check if permissions are identical
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

// Helper function to find template with identical permissions
const findTemplateWithIdenticalPermissions = async (permissions, excludeId = null) => {
    const allTemplates = await RoleTemplate.find({ isActive: true });

    for (const template of allTemplates) {
        if (excludeId && template._id.toString() === excludeId) continue;

        if (arePermissionsIdentical(template.permissions, permissions)) {
            return template;
        }
    }

    return null;
};

// Helper function to generate creative error message
const generateDuplicatePermissionsMessage = (existingTemplate) => {
    const messages = [
        `🎭 Looks like "${existingTemplate.name}" already has the same superpowers! Each template needs its own unique abilities.`,
        `🔄 Template "${existingTemplate.name}" is already wielding these exact permissions. Time to mix it up!`,
        `⚡ These permissions are already mastered by "${existingTemplate.name}". Let's create something unique!`,
        `🎯 "${existingTemplate.name}" has already claimed these permissions. How about a different combination?`,
        `🌟 Permission déjà vu! "${existingTemplate.name}" is already using this exact setup.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
};

// Get all role templates
router.get('/', authenticateToken, requirePermission('users', 'view'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = 'all',
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
            });
        }

        // Validate status parameter
        const validStatuses = ['all', 'active', 'inactive', 'default'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status parameter. Must be one of: all, active, inactive, default'
            });
        }

        // Validate sort parameters
        const validSortFields = ['name', 'createdAt', 'updatedAt', 'usageCount'];
        const validSortOrders = ['asc', 'desc'];

        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sort field. Must be one of: name, createdAt, updatedAt, usageCount'
            });
        }

        if (!validSortOrders.includes(sortOrder)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sort order. Must be one of: asc, desc'
            });
        }

        // Get paginated templates
        const templates = await RoleTemplate.getPaginatedTemplates({
            page: pageNum,
            limit: limitNum,
            status,
            search,
            sortBy,
            sortOrder
        });

        // Get total count for pagination
        const totalCount = await RoleTemplate.getTemplatesCount({
            status,
            search
        });

        // Add canBeDeleted property to each template
        const templatesWithDeleteInfo = templates.map(template => {
            const templateObj = template.toObject();
            templateObj.canBeDeleted = template.canBeDeleted();
            return templateObj;
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.json({
            success: true,
            data: templatesWithDeleteInfo,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? pageNum + 1 : null,
                prevPage: hasPrevPage ? pageNum - 1 : null
            },
            filters: {
                status,
                search,
                sortBy,
                sortOrder
            }
        });
    } catch (error) {
        console.error('Get role templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch role templates'
        });
    }
});

// Get specific role template
router.get('/:id', authenticateToken, requirePermission('users', 'view'), async (req, res) => {
    try {
        const template = await RoleTemplate.findById(req.params.id)
            .populate('createdBy', 'username firstName lastName');

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Role template not found'
            });
        }

        // Add canBeDeleted property to template
        const templateObj = template.toObject();
        templateObj.canBeDeleted = template.canBeDeleted();

        res.json({
            success: true,
            data: templateObj
        });
    } catch (error) {
        console.error('Get role template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch role template'
        });
    }
});

// Create new role template
router.post('/', authenticateToken, requirePermission('users', 'add'), async (req, res) => {
    try {
        const {
            name,
            description,
            icon = 'FiSettings',
            color = 'bg-gradient-to-r from-blue-500 to-cyan-500',
            isAdmin = false,
            permissions = []
        } = req.body;

        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Name and description are required'
            });
        }

        // Check if template name already exists
        const existingTemplate = await RoleTemplate.findOne({
            name: name.trim(),
            isActive: true
        });

        if (existingTemplate) {
            return res.status(400).json({
                success: false,
                message: 'A role template with this name already exists'
            });
        }

        // Check for identical permissions
        const identicalTemplate = await findTemplateWithIdenticalPermissions(permissions);
        if (identicalTemplate) {
            // Populate creator info for the existing template
            await identicalTemplate.populate('createdBy', 'username firstName lastName');

            return res.status(200).json({
                success: true,
                message: generateDuplicatePermissionsMessage(identicalTemplate),
                existingTemplate: identicalTemplate,
                isDuplicate: true
            });
        }

        // Create new template
        const newTemplate = new RoleTemplate({
            name: name.trim(),
            description: description.trim(),
            icon,
            color,
            isAdmin,
            permissions,
            createdBy: req.user._id
        });

        await newTemplate.save();

        // Populate creator info
        await newTemplate.populate('createdBy', 'username firstName lastName');

        res.status(201).json({
            success: true,
            message: 'Role template created successfully',
            data: newTemplate
        });

    } catch (error) {
        console.error('Create role template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create role template'
        });
    }
});

// Update role template
router.put('/:id', authenticateToken, requirePermission('users', 'edit'), async (req, res) => {
    try {
        const {
            name,
            description,
            icon,
            color,
            isAdmin,
            permissions,
            isActive
        } = req.body;

        const template = await RoleTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Role template not found'
            });
        }

        // Check if trying to modify a default template
        if (template.isDefault && (name || description || icon || color || isAdmin !== undefined)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify default role templates'
            });
        }

        // Check if name already exists (if name is being changed)
        if (name && name.trim() !== template.name) {
            const existingTemplate = await RoleTemplate.findOne({
                name: name.trim(),
                isActive: true,
                _id: { $ne: req.params.id }
            });

            if (existingTemplate) {
                return res.status(400).json({
                    success: false,
                    message: 'A role template with this name already exists'
                });
            }
        }

        // Check for identical permissions
        if (permissions && permissions.length > 0) {
            const identicalTemplate = await findTemplateWithIdenticalPermissions(permissions, req.params.id);
            if (identicalTemplate) {
                // Populate creator info for the existing template
                await identicalTemplate.populate('createdBy', 'username firstName lastName');

                return res.status(200).json({
                    success: true,
                    message: generateDuplicatePermissionsMessage(identicalTemplate),
                    existingTemplate: identicalTemplate,
                    isDuplicate: true
                });
            }
        }

        // Update fields
        if (name !== undefined) template.name = name.trim();
        if (description !== undefined) template.description = description.trim();
        if (icon !== undefined) template.icon = icon;
        if (color !== undefined) template.color = color;
        if (isAdmin !== undefined) template.isAdmin = isAdmin;
        if (permissions !== undefined) template.permissions = permissions;
        if (isActive !== undefined) template.isActive = isActive;

        await template.save();
        await template.populate('createdBy', 'username firstName lastName');

        res.json({
            success: true,
            message: 'Role template updated successfully',
            data: template
        });

    } catch (error) {
        console.error('Update role template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update role template'
        });
    }
});

// Delete role template
router.delete('/:id', authenticateToken, requirePermission('users', 'delete'), async (req, res) => {
    try {
        const template = await RoleTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Role template not found'
            });
        }

        // Check if template can be deleted
        if (!template.canBeDeleted()) {
            return res.status(400).json({
                success: false,
                message: template.isDefault
                    ? 'Cannot delete default role templates'
                    : 'Cannot delete templates that have been used to create users'
            });
        }

        await RoleTemplate.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Role template deleted successfully'
        });

    } catch (error) {
        console.error('Delete role template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete role template'
        });
    }
});

// Increment usage count (called when template is used to create a user)
router.post('/:id/increment-usage', authenticateToken, requirePermission('users', 'add'), async (req, res) => {
    try {
        const template = await RoleTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Role template not found'
            });
        }

        await template.incrementUsage();

        res.json({
            success: true,
            message: 'Usage count updated successfully'
        });

    } catch (error) {
        console.error('Increment usage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update usage count'
        });
    }
});

// Get available permissions for templates
router.get('/permissions/available', authenticateToken, requirePermission('users', 'view'), async (req, res) => {
    try {
        const availablePermissions = [
            {
                page: 'users',
                name: 'Users Management',
                description: 'Manage system users and their permissions',
                actions: [
                    { id: 'view', name: 'View Users', description: 'View user list and details' },
                    { id: 'add', name: 'Create Users', description: 'Create new user accounts' },
                    { id: 'edit', name: 'Edit Users', description: 'Modify existing user accounts' },
                    { id: 'delete', name: 'Delete Users', description: 'Remove user accounts' }
                ]
            }
        ];

        res.json({
            success: true,
            data: availablePermissions
        });

    } catch (error) {
        console.error('Get available permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available permissions'
        });
    }
});

// Get active templates for user creation with pagination and search
router.get('/active/for-user-creation', authenticateToken, requirePermission('users', 'add'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Build query with search
        let query = { isActive: true };
        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const totalCount = await RoleTemplate.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // Get paginated templates
        const templates = await RoleTemplate.find(query)
            .populate('createdBy', 'username firstName lastName')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        // Add canBeDeleted property to each template
        const templatesWithDeleteInfo = templates.map(template => {
            const templateObj = template.toObject();
            templateObj.canBeDeleted = template.canBeDeleted();
            return templateObj;
        });

        res.json({
            success: true,
            data: templatesWithDeleteInfo,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Get active templates for user creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active templates'
        });
    }
});

module.exports = router; 