import React, { useState, useEffect } from 'react';
import roleTemplateService from '../services/roleTemplateService';
import { getGradientStyle } from '../utils/gradientUtils';
import '../styles/RoleBadge.css';

/**
 * Reusable RoleBadge component
 * 
 * @param {Object} props - Component props
 * @param {string} props.role - The role name (e.g., 'admin', 'manager', 'custom')
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * // Basic usage
 * <RoleBadge role="admin" />
 * 
 */
const RoleBadge = ({
  role,
  className = ''
}) => {
  const [roleTemplates, setRoleTemplates] = useState([]);

  // Fetch role templates for dynamic colors
  const fetchRoleTemplates = async () => {
    try {
      const response = await roleTemplateService.getTemplates({
        page: 1,
        limit: 100,
        status: 'active'
      });
      console.log('Role templates response:', response);

      if (response.success && response.data && Array.isArray(response.data)) {
        setRoleTemplates(response.data);
      } else if (response.success && response.data && response.data.templates) {
        setRoleTemplates(response.data.templates);
      } else if (response.success && response.templates) {
        setRoleTemplates(response.templates);
      } else if (Array.isArray(response)) {
        setRoleTemplates(response);
      } else if (response.data && Array.isArray(response.data)) {
        setRoleTemplates(response.data);
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchRoleTemplates();
  }, []);

  // Helper function to clean role name for matching
  const cleanRoleName = (name) => {
    return name.toLowerCase()
      .replace(/[0-9]+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim();
  };

  const getRoleBadge = () => {
    const roleText = role.toUpperCase();

    // Find the role template that matches this role
    const roleTemplate = roleTemplates.find(template => {
      const templateName = template.name.toLowerCase();
      const roleName = role.toLowerCase();
      
      // Exact match
      if (templateName === roleName) return true;
      
      // Check if role contains template name or vice versa
      if (templateName.includes(roleName) || roleName.includes(templateName)) return true;
      
      // Check for partial matches using cleaned names
      const cleanTemplateName = cleanRoleName(templateName);
      const cleanRoleNameText = cleanRoleName(roleName);
      
      if (cleanTemplateName === cleanRoleNameText) return true;
      
      // Check if cleaned names contain each other
      if (cleanTemplateName.includes(cleanRoleNameText) || cleanRoleNameText.includes(cleanTemplateName)) return true;
      
      // Check for word-based matching
      const templateWords = cleanTemplateName.split(' ').filter(word => word.length > 2);
      const roleWords = cleanRoleNameText.split(' ').filter(word => word.length > 2);
      
      if (templateWords.length === 0 || roleWords.length === 0) return false;
      
      // Check if most words match
      const matchingWords = templateWords.filter(word => 
        roleWords.some(roleWord => roleWord.includes(word) || word.includes(roleWord))
      );
      
      return matchingWords.length >= Math.min(templateWords.length, roleWords.length) * 0.6;
    });

    // Create inline styles
    const badgeStyle = {
      background: roleTemplate?.color ? getGradientStyle(roleTemplate.color) : 'linear-gradient(to right, #6b7280, #9ca3af)'
    };

    const badgeElement = (
      <span className={`role-badge ${className}`} style={badgeStyle}>
        {roleText}
      </span>
    );

    return badgeElement;
  };

  return getRoleBadge();
};

export default RoleBadge; 