import React from 'react';
import '../styles/StatusBadge.css';

/**
 * Reusable StatusBadge component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - The status value (true for active, false for inactive)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.activeText - Custom text for active status (default: 'Active')
 * @param {string} props.inactiveText - Custom text for inactive status (default: 'Inactive')
 * 
 * @example
 * // Basic usage
 * <StatusBadge isActive={true} />
 * 
 * @example
 * // With custom text
 * <StatusBadge isActive={false} inactiveText="Disabled" />
 * 
 */
const StatusBadge = ({
  isActive,
  className = '',
  activeText = 'Active',
  inactiveText = 'Inactive'
}) => {
  const statusText = isActive ? activeText : inactiveText;
  const statusClass = isActive ? 'active' : 'inactive';

  const badgeElement = (
    <span className={`status-badge ${statusClass} ${className}`}>
      {statusText}
    </span>
  );

  return badgeElement;
};

export default StatusBadge; 