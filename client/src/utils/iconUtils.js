/**
 * Icon utilities for role templates
 * Contains the mapping between icon names and React icon components
 */

import {
    FiSettings,
    FiAward,
    FiBriefcase,
    FiUsers,
    FiShield,
    FiUserCheck,
    FiUserX,
    FiLock,
    FiUnlock,
    FiEye
} from 'react-icons/fi';

// Icon map for converting icon names to React components
export const iconMap = {
    'FiSettings': FiSettings,
    'FiAward': FiAward,
    'FiBriefcase': FiBriefcase,
    'FiUsers': FiUsers,
    'FiShield': FiShield,
    'FiUserCheck': FiUserCheck,
    'FiUserX': FiUserX,
    'FiLock': FiLock,
    'FiUnlock': FiUnlock,
    'FiEye': FiEye
};

/**
 * Get icon component by name
 * @param {string} iconName - Icon identifier
 * @returns {React.Component} React icon component
 */
export const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent || FiSettings;
};

/**
 * Render icon component with optional styling
 * @param {string} iconName - Icon identifier
 * @param {Object} props - Additional props for the icon component
 * @returns {React.Element} Rendered icon element
 */
export const renderIcon = (iconName, props = {}) => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent {...props} />;
};

/**
 * Available icons for templates
 */
export const availableIcons = [
    { value: 'FiSettings', label: 'Settings', icon: <FiSettings /> },
    { value: 'FiAward', label: 'Award', icon: <FiAward /> },
    { value: 'FiBriefcase', label: 'Briefcase', icon: <FiBriefcase /> },
    { value: 'FiUsers', label: 'Users', icon: <FiUsers /> },
    { value: 'FiShield', label: 'Shield', icon: <FiShield /> },
    { value: 'FiUserCheck', label: 'User Check', icon: <FiUserCheck /> },
    { value: 'FiUserX', label: 'User X', icon: <FiUserX /> },
    { value: 'FiLock', label: 'Lock', icon: <FiLock /> },
    { value: 'FiUnlock', label: 'Unlock', icon: <FiUnlock /> },
    { value: 'FiEye', label: 'Eye', icon: <FiEye /> }
]; 