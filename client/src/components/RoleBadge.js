import React, { useState, useEffect } from 'react';
import roleTemplateService from '../services/roleTemplateService';
import Tooltip from './Tooltip';
import '../styles/RoleBadge.css';

/**
 * Reusable RoleBadge component
 * 
 * @param {Object} props - Component props
 * @param {string} props.role - The role name (e.g., 'admin', 'manager', 'custom')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showTooltip - Whether to show tooltip (default: true)
 * @param {string} props.tooltipText - Custom tooltip text (optional)
 * 
 * @example
 * // Basic usage
 * <RoleBadge role="admin" />
 * 
 * @example
 * // With custom tooltip
 * <RoleBadge role="custom" tooltipText="Custom Role" />
 * 
 * @example
 * // Without tooltip
 * <RoleBadge role="manager" showTooltip={false} />
 */
const RoleBadge = ({ 
  role, 
  className = '', 
  showTooltip = true,
  tooltipText = null 
}) => {
  const [roleTemplates, setRoleTemplates] = useState([]);
  const [loadingRoleTemplates, setLoadingRoleTemplates] = useState(false);

  // Fetch role templates for dynamic colors
  const fetchRoleTemplates = async () => {
    try {
      setLoadingRoleTemplates(true);
      const response = await roleTemplateService.getTemplates({
        page: 1,
        limit: 100,
        status: 'active'
      });

      if (response.success && response.data && response.data.templates) {
        setRoleTemplates(response.data.templates);
      } else if (response.success && response.data && Array.isArray(response.data)) {
        setRoleTemplates(response.data);
      } else if (response.success && response.templates) {
        setRoleTemplates(response.templates);
      } else if (Array.isArray(response)) {
        setRoleTemplates(response);
      } else if (response.data && Array.isArray(response.data)) {
        setRoleTemplates(response.data);
      }
    } catch (error) {
      console.error('Error fetching role templates for colors:', error);
      // Continue without role templates - will use fallback colors
    } finally {
      setLoadingRoleTemplates(false);
    }
  };

  useEffect(() => {
    fetchRoleTemplates();
  }, []);

  const getRoleBadge = () => {
    const roleText = role.toUpperCase();

    // Find the role template that matches this role
    const roleTemplate = roleTemplates.find(template => 
      template.name.toLowerCase() === role.toLowerCase() ||
      template.name.toLowerCase().includes(role.toLowerCase()) ||
      role.toLowerCase().includes(template.name.toLowerCase())
    );

    // Use the template's color if found, otherwise use fallback
    const badgeColor = roleTemplate?.color || `role-${role.toLowerCase()}`;

    const badgeElement = (
      <span className={`role-badge ${badgeColor} ${className}`}>
        {roleText}
      </span>
    );

    if (showTooltip) {
      return (
        <Tooltip text={tooltipText || roleText} showOnTruncated={false}>
          {badgeElement}
        </Tooltip>
      );
    }

    return badgeElement;
  };

  return getRoleBadge();
};

export default RoleBadge; 