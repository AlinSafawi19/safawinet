import React from 'react';
import { FiAlertTriangle, FiShield, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import '../styles/RiskBadge.css';

/**
 * Reusable RiskBadge component
 * 
 * @param {Object} props - Component props
 * @param {string} props.riskLevel - The risk level ('low', 'medium', 'high', 'critical')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showIcon - Whether to show the risk icon (default: true)
 * @param {string} props.size - Badge size ('sm', 'md', 'lg') (default: 'md')
 * @param {boolean} props.uppercase - Whether to display text in uppercase (default: true)
 * 
 * @example
 * // Basic usage
 * <RiskBadge riskLevel="high" />
 * 
 * // With custom styling
 * <RiskBadge riskLevel="critical" size="lg" showIcon={false} />
 * 
 * // In a table cell
 * <td className="risk-cell">
 *   <RiskBadge riskLevel={log.riskLevel || 'low'} />
 * </td>
 */
const RiskBadge = ({
  riskLevel = 'low',
  className = '',
  showIcon = true,
  size = 'md',
  uppercase = true
}) => {
  // Normalize risk level to lowercase
  const normalizedRiskLevel = riskLevel.toLowerCase();

  // Get risk level configuration
  const getRiskConfig = (level) => {
    const configs = {
      critical: {
        label: 'Critical',
        color: 'critical',
        icon: FiAlertTriangle,
        bgColor: '#fef2f2',
        textColor: '#991b1b',
        borderColor: '#fecaca',
        iconColor: '#dc2626'
      },
      high: {
        label: 'High',
        color: 'high',
        icon: FiAlertCircle,
        bgColor: '#fff7ed',
        textColor: '#9a3412',
        borderColor: '#fed7aa',
        iconColor: '#ea580c'
      },
      medium: {
        label: 'Medium',
        color: 'medium',
        icon: FiShield,
        bgColor: '#fefce8',
        textColor: '#a16207',
        borderColor: '#fde047',
        iconColor: '#ca8a04'
      },
      low: {
        label: 'Low',
        color: 'low',
        icon: FiCheckCircle,
        bgColor: '#f0fdf4',
        textColor: '#166534',
        borderColor: '#bbf7d0',
        iconColor: '#16a34a'
      }
    };

    return configs[level] || configs.low;
  };

  const config = getRiskConfig(normalizedRiskLevel);
  const IconComponent = config.icon;

  // Size classes
  const sizeClasses = {
    sm: 'risk-badge-sm',
    md: 'risk-badge-md',
    lg: 'risk-badge-lg'
  };

  // Build CSS classes
  const badgeClasses = [
    'risk-badge',
    sizeClasses[size] || sizeClasses.md,
    normalizedRiskLevel === 'critical' ? 'risk-badge-critical' : '',
    uppercase ? 'uppercase' : '',
    className
  ].filter(Boolean).join(' ');

  const iconClasses = [
    'risk-badge-icon',
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
  ].filter(Boolean).join(' ');

  const textClasses = [
    'risk-badge-text',
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm',
    'font-medium'
  ].filter(Boolean).join(' ');

  // Inline styles for colors
  const badgeStyle = {
    backgroundColor: config.bgColor,
    color: config.textColor,
    borderColor: config.borderColor
  };

  const iconStyle = {
    color: config.iconColor
  };

  return (
    <span className={badgeClasses} style={badgeStyle}>
      {showIcon && (
        <IconComponent className={iconClasses} style={iconStyle} />
      )}
      <span className={textClasses}>
        {config.label}
      </span>
    </span>
  );
};

export default RiskBadge; 