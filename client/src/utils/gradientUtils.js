/**
 * Gradient utilities for role templates and badges
 * Contains the mapping between Tailwind gradient classes and CSS gradients
 */

// Available colors for templates (from RoleTemplates.js)
export const availableColors = [
    { value: 'bg-gradient-to-r from-blue-500 to-cyan-500', label: 'Blue', preview: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { value: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Purple', preview: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'bg-gradient-to-r from-green-500 to-emerald-500', label: 'Green', preview: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { value: 'bg-gradient-to-r from-orange-500 to-red-500', label: 'Orange', preview: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { value: 'bg-gradient-to-r from-indigo-500 to-purple-500', label: 'Indigo', preview: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { value: 'bg-gradient-to-r from-teal-500 to-cyan-500', label: 'Teal', preview: 'bg-gradient-to-r from-teal-500 to-cyan-500' }
];

// Gradient map for converting Tailwind classes to CSS gradients
export const gradientMap = {
    'bg-gradient-to-r from-blue-500 to-cyan-500': 'linear-gradient(to right, #3b82f6, #06b6d4)',
    'bg-gradient-to-r from-purple-500 to-pink-500': 'linear-gradient(to right, #8b5cf6, #ec4899)',
    'bg-gradient-to-r from-green-500 to-emerald-500': 'linear-gradient(to right, #10b981, #10b981)',
    'bg-gradient-to-r from-orange-500 to-red-500': 'linear-gradient(to right, #f97316, #ef4444)',
    'bg-gradient-to-r from-indigo-500 to-purple-500': 'linear-gradient(to right, #6366f1, #8b5cf6)',
    'bg-gradient-to-r from-teal-500 to-cyan-500': 'linear-gradient(to right, #14b8a6, #06b6d4)'
};

/**
 * Convert Tailwind gradient class to CSS gradient
 * @param {string} colorClass - Tailwind gradient class
 * @returns {string} CSS gradient string
 */
export const getGradientStyle = (colorClass) => {
    return gradientMap[colorClass] || 'linear-gradient(to right, #6b7280, #9ca3af)';
}; 