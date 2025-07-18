/**
 * Password Strength Analyzer for Frontend
 * Matches the backend password strength logic exactly
 */
class PasswordStrengthAnalyzer {
  constructor() {
    // Common weak passwords and patterns (same as backend)
    this.commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
      'monkey', 'dragon', 'master', 'football', 'baseball', 'sunshine',
      'princess', 'abc123', '111111', '123123', 'admin123', 'password123',
      'qwerty123', 'letmein123', 'welcome123', 'monkey123', 'dragon123'
    ];

    // Common sequential patterns
    this.sequentialPatterns = [
      '123456789', 'abcdefgh', 'qwertyui', 'asdfghjk', 'zxcvbnm',
      '987654321', 'hgfedcba', 'iuytrewq', 'kjhgfdsa', 'mnbvcxz'
    ];

    // Common keyboard patterns
    this.keyboardPatterns = [
      'qwerty', 'asdfgh', 'zxcvbn', '123456', '654321',
      'qazwsx', 'edcrfv', 'tgbyhn', 'ujmikl', 'polkmn'
    ];
  }

  /**
   * Calculate password entropy (measure of randomness)
   * @param {string} password - The password to analyze
   * @returns {number} - Entropy value in bits
   */
  calculateEntropy(password) {
    if (!password) return 0;

    // Count character sets used
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26; // lowercase
    if (/[A-Z]/.test(password)) charsetSize += 26; // uppercase
    if (/\d/.test(password)) charsetSize += 10; // digits
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // special chars

    // Calculate entropy: log2(charset_size ^ password_length)
    return Math.log2(Math.pow(charsetSize, password.length));
  }

  /**
   * Check for repeating characters
   * @param {string} password - The password to analyze
   * @returns {boolean} - True if repeating characters found
   */
  hasRepeatingChars(password) {
    for (let i = 0; i < password.length - 2; i++) {
      if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for sequential characters
   * @param {string} password - The password to analyze
   * @returns {boolean} - True if sequential characters found
   */
  hasSequentialChars(password) {
    const lowerPassword = password.toLowerCase();
    
    // Check for sequential letters
    for (let i = 0; i < lowerPassword.length - 2; i++) {
      const char1 = lowerPassword.charCodeAt(i);
      const char2 = lowerPassword.charCodeAt(i + 1);
      const char3 = lowerPassword.charCodeAt(i + 2);
      
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
    }

    // Check for sequential numbers
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);
      
      if (char1 >= 48 && char1 <= 57 && 
          char2 >= 48 && char2 <= 57 && 
          char3 >= 48 && char3 <= 57) {
        if (char2 === char1 + 1 && char3 === char2 + 1) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for common patterns
   * @param {string} password - The password to analyze
   * @returns {boolean} - True if common patterns found
   */
  hasCommonPatterns(password) {
    const lowerPassword = password.toLowerCase();
    
    // Check against common passwords
    if (this.commonPasswords.includes(lowerPassword)) {
      return true;
    }

    // Check against sequential patterns
    for (const pattern of this.sequentialPatterns) {
      if (lowerPassword.includes(pattern)) {
        return true;
      }
    }

    // Check against keyboard patterns
    for (const pattern of this.keyboardPatterns) {
      if (lowerPassword.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate password strength score (0-100)
   * @param {string} password - The password to analyze
   * @returns {object} - Strength analysis object
   */
  analyzePassword(password) {
    if (!password) {
      return {
        score: 0,
        level: 'very_weak',
        details: {
          length: 0,
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
          hasRepeatingChars: false,
          hasSequentialChars: false,
          hasCommonPatterns: false,
          entropy: 0
        }
      };
    }

    // Basic characteristics
    const length = password.length;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
    const hasRepeatingChars = this.hasRepeatingChars(password);
    const hasSequentialChars = this.hasSequentialChars(password);
    const hasCommonPatterns = this.hasCommonPatterns(password);
    const entropy = this.calculateEntropy(password);

    // Calculate score based on multiple factors
    let score = 0;

    // Length contribution (0-25 points)
    if (length >= 8) score += 10;
    if (length >= 12) score += 10;
    if (length >= 16) score += 5;

    // Character variety contribution (0-25 points)
    if (hasUppercase) score += 5;
    if (hasLowercase) score += 5;
    if (hasNumbers) score += 5;
    if (hasSpecialChars) score += 10;

    // Entropy contribution (0-25 points)
    if (entropy >= 50) score += 10;
    if (entropy >= 60) score += 10;
    if (entropy >= 70) score += 5;

    // Penalties for weak patterns (0-25 points deducted)
    if (hasRepeatingChars) score -= 10;
    if (hasSequentialChars) score -= 10;
    if (hasCommonPatterns) score -= 15;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let level;
    if (score < 20) level = 'very_weak';
    else if (score < 40) level = 'weak';
    else if (score < 60) level = 'medium';
    else if (score < 80) level = 'strong';
    else level = 'very_strong';

    return {
      score,
      level,
      details: {
        length,
        hasUppercase,
        hasLowercase,
        hasNumbers,
        hasSpecialChars,
        hasRepeatingChars,
        hasSequentialChars,
        hasCommonPatterns,
        entropy: Math.round(entropy * 100) / 100
      }
    };
  }

  /**
   * Get password requirements for validation
   * @returns {object} - Password requirements
   */
  getRequirements() {
    return {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    };
  }

  /**
   * Validate password against requirements
   * @param {string} password - The password to validate
   * @returns {object} - Validation result
   */
  validatePassword(password) {
    const requirements = this.getRequirements();
    const analysis = this.analyzePassword(password);
    
    const errors = {};
    
    if (password.length < requirements.minLength) {
      errors.length = `Password must be at least ${requirements.minLength} characters long`;
    }
    
    if (password.length > requirements.maxLength) {
      errors.length = `Password must be no more than ${requirements.maxLength} characters long`;
    }
    
    if (requirements.requireUppercase && !analysis.details.hasUppercase) {
      errors.uppercase = 'Password must contain at least one uppercase letter';
    }
    
    if (requirements.requireLowercase && !analysis.details.hasLowercase) {
      errors.lowercase = 'Password must contain at least one lowercase letter';
    }
    
    if (requirements.requireNumbers && !analysis.details.hasNumbers) {
      errors.numbers = 'Password must contain at least one number';
    }
    
    if (requirements.requireSpecialChars && !analysis.details.hasSpecialChars) {
      errors.specialChars = 'Password must contain at least one special character';
    }
    
    if (requirements.preventCommonPasswords && analysis.details.hasCommonPatterns) {
      errors.commonPassword = 'Password contains common patterns that are not allowed';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      analysis
    };
  }
}

// Export singleton instance
const passwordStrengthAnalyzer = new PasswordStrengthAnalyzer();
export default passwordStrengthAnalyzer; 