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
 * Get current theme from DOM or localStorage
 * @returns {string} Current theme ('light' or 'dark')
 */
export const getCurrentTheme = () => {
    const root = document.documentElement;
    
    if (root.classList.contains('dark')) {
        return 'dark';
    }
    
    if (root.classList.contains('light')) {
        return 'light';
    }
    
    // Fallback to localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }
    
    // Check system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
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
        console.log('Theme preference updated:', theme);
    } catch (error) {
        console.error('Failed to update theme preference:', error);
    }
}; 