/**
 * Theme utility functions for managing application themes
 */

/**
 * Apply theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
export const applyTheme = (theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Apply the new theme
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    return theme;
};

/**
 * Apply user theme preference to document for SweetAlert styling
 * @param {Object} user - User object with preferences
 */
export const applyUserTheme = (user) => {
  if (user && user.userPreferences && user.userPreferences.theme) {
    const theme = user.userPreferences.theme;
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    // Default to light theme if no preference is set
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

/**
 * Get current theme from document
 * @returns {string} Current theme ('light' or 'dark')
 */
export const getCurrentTheme = () => {
  return document.documentElement.getAttribute('data-theme') || 'light';
};

/**
 * Toggle between light and dark themes
 * @returns {string} New theme
 */
export const toggleTheme = () => {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    return applyTheme(newTheme);
};

/**
 * Initialize theme based on user preferences or system default
 * @param {Object} user - User object with preferences
 */
export const initializeTheme = (user) => {
    if (user && user.userPreferences && user.userPreferences.theme) {
        return applyTheme(user.userPreferences.theme);
    }
    
    // Use saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    return applyTheme(defaultTheme);
};

/**
 * Update user theme preference (for backend sync)
 * @param {string} theme - New theme preference
 * @param {Function} updateUserPreference - Function to update user preference in backend
 */
export const updateUserThemePreference = async (theme, updateUserPreference) => {
    try {
        if (updateUserPreference) {
            await updateUserPreference({ theme });
        }
    } catch (error) {
    }
}; 