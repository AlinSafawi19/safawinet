const nodemailer = require('nodemailer');
const securityConfig = require('../config/security');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Email configuration - supports both Gmail and custom domain
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'alinsafawi19@gmail.com',
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    // Debug logging for troubleshooting
    console.log('Email configuration:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      passSet: !!smtpConfig.auth.pass
    });

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log('SMTP server is ready to send emails');
      }
    });
  }

  // Common email template wrapper
  getEmailTemplate(content, title, headerColor = '#D72638') {
    const currentYear = new Date().getFullYear();
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2c3e50; background: #f8f9fa; }
          .email-container { max-width: 500px; margin: 0 auto; background: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
          .header { background: ${headerColor}; color: #ffffff; padding: 40px 30px; text-align: center; }
          .logo { width: 50px; height: 50px; margin: 0 auto 20px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: ${headerColor}; text-align: center; line-height: 1; }
          .header h1 { font-size: 24px; font-weight: 500; margin-bottom: 8px; letter-spacing: -0.5px; }
          .header .subtitle { font-size: 14px; opacity: 0.9; font-weight: 300; }
          .content { padding: 40px 30px; background: #ffffff; }
          .content h2 { color: #2c3e50; margin-bottom: 24px; font-size: 20px; font-weight: 500; }
          .content p { margin-bottom: 16px; font-size: 15px; color: #5a6c7d; line-height: 1.7; }
          .alert-box { background: #fff5f5; border: 1px solid #fed7d7; padding: 16px; margin: 20px 0; border-radius: 6px; }
          .info-box { background: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; margin: 20px 0; border-radius: 6px; }
          .warning-box { background: #fffaf0; border: 1px solid #fed7aa; padding: 16px; margin: 20px 0; border-radius: 6px; }
          .success-box { background: #f0fff4; border: 1px solid #9ae6b4; padding: 16px; margin: 20px 0; border-radius: 6px; }
          .btn { display: inline-block; padding: 12px 30px; background: ${headerColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .btn:hover { opacity: 0.9; }
          .link-btn { color: #1976d2; text-decoration: underline; font-weight: 500; }
          .link-btn:hover { color: #1565c0; }
          .code-block { background: #f8f9fa; border: 1px solid #e9ecef; padding: 16px; margin: 16px 0; border-radius: 6px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace; font-size: 13px; color: #495057; }
          .footer { background: #f8f9fa; color: #6c757d; padding: 24px; text-align: center; font-size: 13px; border-top: 1px solid #e9ecef; }
          .footer p { margin-bottom: 8px; }
          .social-links { margin-top: 12px; }
          .social-links a { color: #6c757d; text-decoration: none; margin: 0 8px; font-size: 12px; }
          ul, ol { margin-left: 16px; margin-bottom: 16px; }
          li { margin-bottom: 6px; color: #5a6c7d; }
          .highlight { background: #e3f2fd; padding: 2px 6px; border-radius: 4px; color: #1976d2; font-weight: 500; }
          @media (max-width: 600px) {
            .content { padding: 24px 20px; }
            .header { padding: 30px 20px; }
            .header h1 { font-size: 20px; }
            .email-container { margin: 10px; border-radius: 6px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">SN</div>
            <h1>SafawiNet</h1>
            <div class="subtitle">Secure Network Management Platform</div>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>© ${currentYear} SafawiNet. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <div class="social-links">
              <a href="#">Support</a> | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>We received a request to reset your password for your SafawiNet account. If you didn't make this request, you can safely ignore this email.</p>
      
      <div class="info-box">
        <p><strong>Security Notice:</strong> This link will expire in <span class="highlight">1 hour</span> for your protection.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="link-btn">Reset My Password</a>
      </div>
      
      <div class="warning-box">
        <p><strong>If you didn't request this:</strong></p>
        <ul>
          <li>Your account may be compromised</li>
          <li>Contact our security team immediately</li>
          <li>Review your recent account activity</li>
        </ul>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Password Reset Request - SafawiNet',
      html: this.getEmailTemplate(content, 'Password Reset Request', '#D72638')
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSecurityAlert(user, alertData) {
    const content = `
      <h2>Security Alert</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>We detected suspicious activity on your SafawiNet account that requires your immediate attention.</p>
      
      <div class="warning-box">
        <h3>Alert Details:</h3>
        <p><strong>Type:</strong> ${alertData.type}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> <span class="highlight">${alertData.ip}</span></p>
        <p><strong>Device:</strong> ${alertData.device}</p>
      </div>
      
      <div class="info-box">
        <p><strong>If this was you:</strong> No action is needed.</p>
        <p><strong>If this wasn't you:</strong> Take immediate action below.</p>
      </div>
      
      <h3>Recommended Actions:</h3>
      <ol>
        <li><strong>Change your password immediately</strong></li>
        <li><strong>Enable two-factor authentication</strong> if not already enabled</li>
        <li><strong>Review your recent account activity</strong></li>
        <li><strong>Contact our security team</strong> if you suspect unauthorized access</li>
      </ol>
      
      <div class="success-box">
        <p><strong>Security Tip:</strong> Use unique, strong passwords for each of your accounts and enable 2FA wherever possible.</p>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Security Alert - SafawiNet',
      html: this.getEmailTemplate(content, 'Security Alert', '#D72638')
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Security alert email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTwoFactorSetupEmail(user, qrCodeUrl, backupCodes) {
    const content = `
      <h2>Two-Factor Authentication Enabled</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Great news! Two-factor authentication has been successfully enabled for your SafawiNet account. Your account is now more secure than ever.</p>
      
      <div class="success-box">
        <h3>2FA Setup Complete</h3>
        <p>Your account now has an additional layer of security protection.</p>
      </div>
      
      <h3>Backup Codes</h3>
      <p>Store these backup codes in a secure location. You can use them if you lose access to your authenticator app:</p>
      
      <div class="code-block">
        ${backupCodes.map(code => `<div style="margin: 5px 0; font-weight: bold;">${code}</div>`).join('')}
      </div>
      
      <div class="warning-box">
        <h3>Important Security Notes:</h3>
        <ul>
          <li>Keep your backup codes secure and private</li>
          <li>Don't share them with anyone</li>
          <li>You can generate new codes anytime from your account settings</li>
          <li>Each code can only be used once</li>
        </ul>
      </div>
      
      <div class="info-box">
        <p><strong>Tip:</strong> Consider storing backup codes in a password manager or secure note-taking app.</p>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Two-Factor Authentication Setup - SafawiNet',
      html: this.getEmailTemplate(content, '2FA Setup Complete', '#4D4D4D')
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('2FA setup email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAccountLockedEmail(user, lockReason) {
    const content = `
      <h2>Account Temporarily Locked</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Your SafawiNet account has been temporarily locked for security reasons. This is an automated security measure to protect your account.</p>
      
      <div class="warning-box">
        <h3>Lock Details:</h3>
        <p><strong>Reason:</strong> ${lockReason}</p>
        <p><strong>Duration:</strong> <span class="highlight">30 minutes</span></p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="info-box">
        <p><strong>What happens next:</strong></p>
        <ul>
          <li>Your account will be automatically unlocked after 30 minutes</li>
          <li>You can try logging in again after the lock period</li>
          <li>No action is required from you</li>
        </ul>
      </div>
      
      <div class="success-box">
        <p><strong>Security Feature:</strong> This automatic lock helps prevent unauthorized access attempts and protects your account.</p>
      </div>
      
      <p>If you believe this lock was applied in error, please contact our support team.</p>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Account Temporarily Locked - SafawiNet',
      html: this.getEmailTemplate(content, 'Account Locked', '#8A8A8A')
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Account locked email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user) {
    const content = `
      <h2>Welcome to SafawiNet!</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Welcome to SafawiNet! We're excited to have you on board. Your account has been created successfully and you're now part of our secure network management platform.</p>
      
      <div class="success-box">
        <h3>Account Created Successfully</h3>
        <p><strong>Username:</strong> <span class="highlight">${user.username}</span></p>
        <p><strong>Email:</strong> <span class="highlight">${user.email}</span></p>
        <p><strong>Role:</strong> <span class="highlight">${user.isAdmin ? 'Administrator' : 'User'}</span></p>
      </div>
      
      <h3>Security Recommendations:</h3>
      <div class="info-box">
        <ol>
          <li><strong>Enable two-factor authentication</strong> for enhanced security</li>
          <li><strong>Use a strong, unique password</strong> that you don't use elsewhere</li>
          <li><strong>Keep your login credentials secure</strong> and never share them</li>
          <li><strong>Regularly review your account activity</strong> for any suspicious behavior</li>
        </ol>
      </div>
      
      <div class="success-box">
        <h3>Getting Started:</h3>
        <ul>
          <li>Complete your profile setup</li>
          <li>Explore the platform features</li>
          <li>Set up your security preferences</li>
          <li>Review our security guidelines</li>
        </ul>
      </div>
      
      <p>If you have any questions or need assistance, our support team is here to help!</p>
      
      <p><strong>Best regards,</strong><br>The SafawiNet Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Welcome to SafawiNet!',
      html: this.getEmailTemplate(content, 'Welcome to SafawiNet', '#4D4D4D')
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Please verify your email address to complete your SafawiNet account setup. This helps us ensure the security of your account.</p>
      
      <div class="info-box">
        <p><strong>Important:</strong> This verification link will expire in <span class="highlight">24 hours</span> for your protection.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" class="link-btn">Verify My Email</a>
      </div>
      
      <div class="alert-box">
        <p><strong>Security Notice:</strong></p>
        <ul>
          <li>Only click this link if you created a SafawiNet account</li>
          <li>This link is unique to your account and should not be shared</li>
          <li>If you didn't create an account, please ignore this email</li>
        </ul>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Verify Your Email - SafawiNet',
      html: this.getEmailTemplate(content, 'Email Verification', '#8A8A8A')
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmailVerifiedConfirmation(user) {
    const content = `
      <h2>Email Verified Successfully</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Your email address has been successfully verified! Your SafawiNet account is now more secure.</p>
      
      <div class="success-box">
        <h3>Verification Complete</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Verified:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="info-box">
        <h3>Next Steps for Enhanced Security:</h3>
        <ul>
          <li><strong>Verify your phone number</strong> (if provided)</li>
          <li><strong>Enable two-factor authentication</strong></li>
          <li><strong>Review your security settings</strong></li>
          <li><strong>Set up backup codes</strong> for 2FA</li>
        </ul>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Email Verified - SafawiNet',
      html: this.getEmailTemplate(content, 'Email Verified', '#4D4D4D')
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email verified confirmation error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService(); 