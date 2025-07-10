// Utility functions for avatar handling

/**
 * Generate initials from user data
 * @param {Object} user - User object with firstName, lastName, username
 * @returns {string} - User initials (e.g., "JD" for John Doe)
 */
export const generateInitials = (user) => {
  if (!user) return 'U';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }
  
  return 'U';
};

/**
 * Get profile picture URL or generate initials
 * @param {Object} user - User object
 * @returns {Object} - Object with type ('image' or 'initials') and value
 */
export const getProfileDisplay = (user) => {
  if (!user) {
    return { type: 'initials', value: 'U' };
  }
  
  // Check if user has uploaded profile picture
  if (user.profilePicture && user.profilePicture.url) {
    return { 
      type: 'image', 
      value: user.profilePicture.url 
    };
  }
  
  // Use profile initials from database or generate them
  const initials = user.profileInitials || generateInitials(user);
  return { type: 'initials', value: initials };
};

// Color palette for avatar backgrounds
export const AVATAR_COLORS = [
  '#2196F3', // Blue
  '#607D8B', // Blue Grey
  '#9C27B0', // Purple
  '#3F51B5', // Indigo
  '#009688', // Teal
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#795548', // Brown
  '#D72638', // Accent Red
  '#10B981', // Green accent
  '#FFB300', // Amber
  '#6D4C41', // Deep brown
  '#00897B', // Teal dark
];

// Returns a color from the palette based on a string (username/email/firstName)
export function getInitialsColor(str = '') {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  console.log('getInitialsColor input:', str, 'hash:', hash, 'index:', index); // DEBUG
  return AVATAR_COLORS[index];
}

/**
 * Get user's display name
 * @param {Object} user - User object
 * @returns {string} - Display name
 */
export const getDisplayName = (user) => {
  if (!user) return 'User';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.username) {
    return user.username;
  }
  
  return 'User';
}; 