import React from 'react';
import '../styles/StatusBadge.css';

/**
 * Reusable StatusBadge component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - The status value (true for active, false for inactive)
 * @param {boolean} props.isDefault - Whether this is a default template
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.activeText - Custom text for active status (default: 'Active')
 * @param {string} props.inactiveText - Custom text for inactive status (default: 'Inactive')
 * @param {string} props.defaultText - Custom text for default status (default: 'Default')
 * @param {string} props.templateId - The template ID to check if it's custom
 * 
 * @example
 * // Basic usage
 * <StatusBadge isActive={true} />
 * 
 * @example
 * // With default template - shows "Default" regardless of isActive
 * <StatusBadge isActive={false} isDefault={true} />
 * 
 * @example
 * // Custom role - shows no badge
 * <StatusBadge isActive={false} templateId="custom" />
 * 
 * @example
 * // With custom text
 * <StatusBadge isActive={false} inactiveText="Disabled" />
 * 
 */
const StatusBadge = ({
  isActive,
  isDefault = false,
  className = '',
  activeText = 'Active',
  inactiveText = 'Inactive',
  defaultText = 'Default',
  templateId = ''
}) => {
  // If it's a custom template, don't show any badge
  if (templateId === 'custom') {
    return null;
  }

  // If it's a default template, show default badge regardless of isActive
  if (isDefault) {
    return (
      <span className={`status-badge default ${className}`} title="Default template">
        {defaultText}
      </span>
    );
  }

  // Otherwise show active/inactive status
  const statusText = isActive ? activeText : inactiveText;
  const statusClass = isActive ? 'active' : 'inactive';

  return (
    <span className={`status-badge ${statusClass} ${className}`} title={`${statusText} template`}>
      {statusText}
    </span>
  );
};

export default StatusBadge; 