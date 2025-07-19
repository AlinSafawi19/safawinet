import React, { useState } from 'react';
import {
    FiEye,
    FiArrowRight,
    FiCheck,
    FiUsers,
    FiEdit,
    FiTrash2,
    FiMoreVertical,
    FiClock,
    FiUser,
    FiToggleLeft,
    FiToggleRight,
    FiX,
    FiShield
} from 'react-icons/fi';
import '../styles/TemplateCard.css';
import { getGradientStyle } from '../utils/gradientUtils';
import { renderIcon } from '../utils/iconUtils';
import StatusBadge from './StatusBadge';

const TemplateCard = ({
    template,
    size = 'medium', // 'small', 'medium', 'large', 'compact'
    variant = 'default', // 'default', 'selectable', 'editable', 'detailed'
    selected = false,
    onClick,
    onEdit,
    onDelete,
    onView,
    onToggleStatus,
    showActions = false,
    showStats = false,
    showCreator = false,
    permissionDisplayMode = 'badge', // 'badge', 'dots', 'compact', 'none'
    className = '',
    disabled = false,
    loading = false,
    ...props
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionModalData, setPermissionModalData] = useState(null);

    // Helper function to get permission summary
    const getPermissionSummary = (permissions) => {
        if (!permissions || permissions.length === 0) return { count: 0, summary: 'No permissions' };

        const totalActions = permissions.reduce((sum, perm) => sum + perm.actions.length, 0);
        const pages = permissions.map(p => p.page.replace(/_/g, ' ')).join(', ');

        return {
            count: totalActions,
            summary: `${pages} (${totalActions} actions)`
        };
    };

    // Helper function to get permission badge color
    const getPermissionBadgeColor = (permissionCount) => {
        if (permissionCount === 0) return 'bg-gray-400';
        if (permissionCount <= 3) return 'bg-green-500';
        if (permissionCount <= 6) return 'bg-blue-500';
        if (permissionCount <= 9) return 'bg-orange-500';
        return 'bg-red-500';
    };

    // Helper function to get permission dots
    const getPermissionDots = (permissions) => {
        if (!permissions || permissions.length === 0) return [];

        const dots = [];
        permissions.forEach(permission => {
            const actionCount = permission.actions.length;
            const color = actionCount <= 2 ? '#10b981' :
                actionCount <= 4 ? '#3b82f6' :
                    actionCount <= 6 ? '#f59e0b' : '#ef4444';

            dots.push({
                color,
                count: actionCount,
                page: permission.page
            });
        });

        return dots.slice(0, 4); // Limit to 4 dots
    };

    // Helper function to get compact permission text
    const getCompactPermissionText = (permissions) => {
        if (!permissions || permissions.length === 0) return '';

        const totalActions = permissions.reduce((sum, perm) => sum + perm.actions.length, 0);
        const pages = permissions.map(p => p.page.replace(/_/g, ' ')).slice(0, 2);

        if (pages.length === 1) {
            return `${pages[0]} (${totalActions})`;
        } else if (pages.length === 2) {
            return `${pages[0]}, ${pages[1]} (${totalActions})`;
        } else {
            return `${pages[0]}, +${pages.length - 1} more (${totalActions})`;
        }
    };

    // Handle permission details modal
    const handlePermissionClick = (e, permissions) => {
        e.stopPropagation();
        if (!permissions || permissions.length === 0) {
            setPermissionModalData({
                title: 'No Permissions',
                message: 'This template has no permissions assigned.',
                permissions: []
            });
        } else {
            setPermissionModalData({
                title: `${template.name} Permissions`,
                message: `Detailed permissions for ${template.name}`,
                permissions: permissions
            });
        }
        setShowPermissionModal(true);
    };

    // Close permission modal
    const closePermissionModal = () => {
        setShowPermissionModal(false);
        setPermissionModalData(null);
    };

    // Get size-specific styles
    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    card: 'template-card-small',
                    icon: 'template-icon-small',
                    name: 'template-name-small',
                    description: 'template-description-small',
                    badge: 'permission-badge-small'
                };
            case 'large':
                return {
                    card: 'template-card-large',
                    icon: 'template-icon-large',
                    name: 'template-name-large',
                    description: 'template-description-large',
                    badge: 'permission-badge-large'
                };
            case 'compact':
                return {
                    card: 'template-card-compact',
                    icon: 'template-icon-compact',
                    name: 'template-name-compact',
                    description: 'template-description-compact',
                    badge: 'permission-badge-compact'
                };
            default: // medium
                return {
                    card: 'template-card-medium',
                    icon: 'template-icon-medium',
                    name: 'template-name-medium',
                    description: 'template-description-medium',
                    badge: 'permission-badge-medium'
                };
        }
    };

    // Get variant-specific styles
    const getVariantStyles = () => {
        switch (variant) {
            case 'selectable':
                return 'template-card-selectable';
            case 'editable':
                return 'template-card-editable';
            case 'detailed':
                return 'template-card-detailed';
            default:
                return 'template-card-default';
        }
    };

    const sizeStyles = getSizeStyles();
    const variantStyles = getVariantStyles();
    const permissionSummary = getPermissionSummary(template.permissions);
    const permissionDots = getPermissionDots(template.permissions);
    const compactPermissionText = getCompactPermissionText(template.permissions);

    // Handle card click
    const handleCardClick = (e) => {
        if (disabled || loading) return;
        if (onClick) onClick(template, e);
    };

    // Handle action menu
    const handleActionClick = (action, e) => {
        e.stopPropagation();
        setShowMenu(false);

        switch (action) {
            case 'edit':
                if (onEdit) onEdit(template);
                break;
            case 'delete':
                if (onDelete) onDelete(template);
                break;
            case 'view':
                if (onView) onView(template);
                break;
            case 'toggleStatus':
                if (onToggleStatus) onToggleStatus(template);
                break;
        }
    };

    if (loading) {
        return (
            <div className={`template-card-loading ${sizeStyles.card} ${className}`}>
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading...</div>
            </div>
        );
    }

    return (
        <>
            {/* Permission Details Modal */}
            {showPermissionModal && permissionModalData && (
                <div className="permission-modal modal-overlay" onClick={closePermissionModal}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title"><span className="title-icon"><FiShield /></span> {permissionModalData.title}</h2>

                            <button className="btn btn-danger btn-md" onClick={closePermissionModal}>
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-content">
                            {permissionModalData.permissions.length === 0 ? (
                                <div className="no-permissions-message">
                                    <p>{permissionModalData.message}</p>
                                </div>
                            ) : (
                                <div className="permissions-list">
                                    {permissionModalData.permissions.map((permission, index) => (
                                        <div key={index} className="permission-item">
                                            <div className="permission-page">
                                                <h4>{permission.page.replace(/_/g, ' ')}</h4>
                                            </div>
                                            <div className="permission-actions">
                                                {permission.actions.map((action, actionIndex) => (
                                                    <span key={actionIndex} className="permission-action">
                                                        {action.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`
                    template-card 
                    ${sizeStyles.card} 
                    ${variantStyles}
                    ${template.color || 'bg-gradient-to-r from-blue-500 to-cyan-500'}
                    ${selected ? 'selected' : ''}
                    ${disabled ? 'disabled' : ''}
                    ${className}
                `}
                onClick={handleCardClick}
                {...props}
            >
                {/* Template Info */}
                <div className="template-info">
                    <div className="template-header">
                        <div className="template-icon-container">
                            <div
                                className={`template-icon ${sizeStyles.icon}`}
                                style={{
                                    background: template.id === 'custom' ? 'linear-gradient(to right, #6b7280, #9ca3af)' :
                                        template.color ? getGradientStyle(template.color) : 'linear-gradient(to right, #6b7280, #9ca3af)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    width: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
                                    height: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
                                    color: 'white',
                                    fontSize: size === 'small' ? '14px' : size === 'large' ? '20px' : '16px'
                                }}
                            >
                                {renderIcon(template.icon || 'FiSettings')}
                            </div>
                        </div>
                        <div className="template-text-content">
                            <div className="template-header-row">
                                <h3 className={`template-name ${sizeStyles.name}`}>
                                    {template.name}
                                </h3>

                                {/* Status badges */}
                                <div className="template-status-badges">
                                    <StatusBadge
                                        isActive={template.isActive}
                                        isDefault={template.isDefault}
                                        templateId={template.id}
                                    />
                                </div>
                            </div>

                            {showActions && (
                                <div className="template-actions">
                                    <button
                                        className="action-menu-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(!showMenu);
                                        }}
                                        title="More actions"
                                    >
                                        <FiMoreVertical />
                                    </button>

                                    {showMenu && (
                                        <div className="action-menu">
                                            {onView && (
                                                <button onClick={(e) => handleActionClick('view', e)}>
                                                    <FiEye /> View Details
                                                </button>
                                            )}
                                            {onEdit && !template.isDefault && (
                                                <button onClick={(e) => handleActionClick('edit', e)}>
                                                    <FiEdit /> Edit Template
                                                </button>
                                            )}
                                            {onToggleStatus && !template.isDefault && (
                                                <button onClick={(e) => handleActionClick('toggleStatus', e)}>
                                                    {template.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                                                    {template.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                            {onDelete && template.canBeDeleted !== false && (
                                                <button
                                                    onClick={(e) => handleActionClick('delete', e)}
                                                    className="delete-action"
                                                >
                                                    <FiTrash2 /> Delete Template
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <p className={`template-description ${sizeStyles.description}`}>
                        {template.description}
                    </p>

                    {/* Permission Display */}
                    {permissionDisplayMode !== 'none' && (
                        <div className="template-permissions">
                            {permissionDisplayMode === 'badge' && (
                                <div className="permission-badge-container">
                                    <div
                                        className={`permission-badge ${getPermissionBadgeColor(permissionSummary.count)} ${sizeStyles.badge}`}
                                        onClick={(e) => handlePermissionClick(e, template.permissions)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: size === 'small' ? '1px 6px' : size === 'large' ? '4px 12px' : '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: size === 'small' ? '10px' : size === 'large' ? '13px' : '11px',
                                            fontWeight: '600',
                                            color: 'white',
                                            backgroundColor: permissionSummary.count === 0 ? '#9ca3af' :
                                                permissionSummary.count <= 3 ? '#10b981' :
                                                    permissionSummary.count <= 6 ? '#3b82f6' :
                                                        permissionSummary.count <= 9 ? '#f59e0b' : '#ef4444',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <span>🔑</span>
                                        <span>{permissionSummary.count}</span>
                                    </div>
                                    {permissionSummary.count > 0 && size !== 'compact' && (
                                        <span className="permission-hint">
                                            {permissionSummary.summary}
                                        </span>
                                    )}
                                </div>
                            )}

                            {permissionDisplayMode === 'dots' && (
                                <div className="permission-dots-container">
                                    {permissionDots.map((dot, index) => (
                                        <div
                                            key={index}
                                            className="permission-dot"
                                            onClick={(e) => handlePermissionClick(e, template.permissions)}
                                            style={{
                                                width: size === 'small' ? '6px' : size === 'large' ? '10px' : '8px',
                                                height: size === 'small' ? '6px' : size === 'large' ? '10px' : '8px',
                                                borderRadius: '50%',
                                                backgroundColor: dot.color,
                                                display: 'inline-block',
                                                marginRight: '4px',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        />
                                    ))}
                                    {permissionDots.length === 0 && (
                                        <span className="no-permissions">No permissions</span>
                                    )}
                                </div>
                            )}

                            {permissionDisplayMode === 'compact' && (
                                <div className="permission-compact-container">
                                    <span
                                        className="permission-compact-text"
                                        onClick={(e) => handlePermissionClick(e, template.permissions)}
                                        style={{
                                            fontSize: size === 'small' ? '9px' : size === 'large' ? '12px' : '10px',
                                            color: permissionSummary.count === 0 ? '#9ca3af' : '#1f3bb3',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'inline-block',
                                            padding: size === 'small' ? '1px 4px' : size === 'large' ? '3px 8px' : '2px 6px',
                                            backgroundColor: permissionSummary.count === 0 ? '#f3f4f6' : '#eaf0fb',
                                            borderRadius: '4px',
                                            border: `1px solid ${permissionSummary.count === 0 ? '#e5e7eb' : '#bee5eb'}`,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {compactPermissionText || 'No permissions'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Template Stats */}
                    {showStats && (
                        <div className="template-stats">
                            {template.usageCount !== undefined && (
                                <div className="stat-item">
                                    <FiUsers />
                                    <span>{template.usageCount} users</span>
                                </div>
                            )}
                            {template.lastUsed && (
                                <div className="stat-item">
                                    <FiClock />
                                    <span>Last used {new Date(template.lastUsed).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Creator Info */}
                    {showCreator && template.createdBy && (
                        <div className="template-creator">
                            <FiUser />
                            <span>Created by {template.createdBy.firstName} {template.createdBy.lastName}</span>
                        </div>
                    )}
                </div>

                {/* Template Arrow/Check */}
                {variant === 'selectable' && (
                    <div className="template-arrow">
                        {selected ? <FiCheck /> : <FiArrowRight />}
                    </div>
                )}
            </div>
        </>
    );
};

export default TemplateCard; 