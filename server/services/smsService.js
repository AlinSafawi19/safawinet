// Placeholder SMS service - Phone verification disabled
class SMSService {
  constructor() {
  }

  async sendVerificationCode(phoneNumber, code) {
    return { success: false, error: 'Phone verification is currently disabled' };
  }

  async sendVerificationSuccess(phoneNumber) {
    return { success: false, error: 'Phone verification is currently disabled' };
  }

  validatePhoneNumber(phoneNumber) {
    return false; // Always return false since verification is disabled
  }

  formatPhoneNumber(phoneNumber) {
    return phoneNumber; // Return as-is
  }

  isConfigured() {
    return false; // Always return false since verification is disabled
  }
}

module.exports = new SMSService(); 