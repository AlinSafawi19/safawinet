// SMS Service - DISABLED (Phone verification will be implemented later)
// const twilio = require('twilio');
// require('dotenv').config();

// class SMSService {
//   constructor() {
//     this.client = null;
//     this.initializeClient();
//   }

//   initializeClient() {
//     // Initialize Twilio client - credentials are required
//     if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
//       this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//       console.log('SMS service initialized with Twilio');
//     } else {
//       console.error('SMS service initialization failed: Missing Twilio credentials');
//       console.error('Required environment variables:');
//       console.error('- TWILIO_ACCOUNT_SID');
//       console.error('- TWILIO_AUTH_TOKEN');
//       console.error('- TWILIO_PHONE_NUMBER');
//       throw new Error('SMS service requires Twilio credentials to be configured');
//     }
//   }

//   async sendVerificationCode(phoneNumber, code) {
//     const message = `Your SafawiNet verification code is: ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`;

//     if (!this.client) {
//       throw new Error('SMS service not properly initialized. Please check Twilio configuration.');
//     }

//     try {
//       await this.client.messages.create({
//         body: message,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         to: phoneNumber
//       });
//       return { success: true };
//     } catch (error) {
//       console.error('SMS send error:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   async sendVerificationSuccess(phoneNumber) {
//     const message = 'Your phone number has been successfully verified for your SafawiNet account. Thank you for completing the verification process.';

//     if (!this.client) {
//       throw new Error('SMS service not properly initialized. Please check Twilio configuration.');
//     }

//     try {
//       await this.client.messages.create({
//         body: message,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         to: phoneNumber
//       });
//       return { success: true };
//     } catch (error) {
//       console.error('SMS confirmation error:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   // Validate phone number format
//   validatePhoneNumber(phoneNumber) {
//     // Basic phone number validation
//     const phoneRegex = /^\+?[1-9]\d{1,14}$/;
//     return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
//   }

//   // Format phone number for display
//   formatPhoneNumber(phoneNumber) {
//     const cleaned = phoneNumber.replace(/\D/g, '');
//     if (cleaned.length === 10) {
//       return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
//     } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
//       return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
//     }
//     return phoneNumber;
//   }

//   // Check if SMS service is properly configured
//   isConfigured() {
//     return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
//   }
// }

// module.exports = new SMSService();

// Placeholder SMS service - Phone verification disabled
class SMSService {
  constructor() {
    console.log('SMS service disabled - Phone verification will be implemented later');
  }

  async sendVerificationCode(phoneNumber, code) {
    console.log('SMS verification disabled - Phone verification will be implemented later');
    return { success: false, error: 'Phone verification is currently disabled' };
  }

  async sendVerificationSuccess(phoneNumber) {
    console.log('SMS confirmation disabled - Phone verification will be implemented later');
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