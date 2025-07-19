import React from 'react';
import Tooltip from './Tooltip';
import '../styles/StatusBadge.css';

/**
 * Reusable StatusBadge component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - The status value (true for active, false for inactive)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showTooltip - Whether to show tooltip (default: true)
 * @param {string} props.tooltipText - Custom tooltip text (optional)
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
 * @example
 * // Without tooltip
 * <StatusBadge isActive={true} showTooltip={false} />
 * 
 * @example
 * // With custom tooltip
 * <StatusBadge isActive={true} tooltipText="User is currently active" />
 */
const StatusBadge = ({ 
  isActive, 
  className = '', 
  showTooltip = true,
  tooltipText = null,
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

  if (showTooltip) {
    return (
      <Tooltip text={tooltipText || statusText} showOnTruncated={false}>
        {badgeElement}
      </Tooltip>
    );
  }

  return badgeElement;
};

export default StatusBadge; 