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
  getEmailTemplate(content, title, headerColor = '#1a365d', accentColor = '#3182ce') {
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
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1a202c; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px 0;
          }
          .email-wrapper { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .header { 
            background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%);
            color: #ffffff; 
            padding: 50px 40px 40px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }
          .logo-container {
            position: relative;
            z-index: 2;
            margin-bottom: 25px;
          }
          .logo-text {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -1px;
            background: linear-gradient(45deg, #ffffff, #f7fafc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 8px;
          }
          .logo-subtitle {
            font-size: 14px;
            font-weight: 400;
            opacity: 0.9;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 600; 
            margin-bottom: 12px; 
            letter-spacing: -0.5px;
            position: relative;
            z-index: 2;
          }
          .header .subtitle { 
            font-size: 16px; 
            opacity: 0.9; 
            font-weight: 400;
            position: relative;
            z-index: 2;
          }
          .content { 
            padding: 50px 40px; 
            background: #ffffff;
            position: relative;
          }
          .content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 40px;
            right: 40px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          }
          .content h2 { 
            color: #1a202c; 
            margin-bottom: 30px; 
            font-size: 24px; 
            font-weight: 600;
            letter-spacing: -0.5px;
          }
          .content h3 {
            color: #2d3748;
            margin: 25px 0 15px;
            font-size: 18px;
            font-weight: 600;
          }
          .content p { 
            margin-bottom: 20px; 
            font-size: 16px; 
            color: #4a5568; 
            line-height: 1.7;
          }
          .alert-box { 
            background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
            border-left: 4px solid #e53e3e;
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(229, 62, 62, 0.1);
          }
          .info-box { 
            background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
            border-left: 4px solid #3182ce;
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(49, 130, 206, 0.1);
          }
          .warning-box { 
            background: linear-gradient(135deg, #faf089 0%, #f6e05e 100%);
            border-left: 4px solid #d69e2e;
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(214, 158, 46, 0.1);
          }
          .success-box { 
            background: linear-gradient(135deg, #9ae6b4 0%, #68d391 100%);
            border-left: 4px solid #38a169;
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(56, 161, 105, 0.1);
          }
          .btn { 
            display: inline-block; 
            padding: 16px 32px; 
            background: #ffffff;
            color: ${headerColor}; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 25px 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            text-align: center;
            min-width: 200px;
            border: 2px solid ${headerColor};
          }
          .btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            background: ${headerColor};
            color: #ffffff;
          }
          .link-btn { 
            color: #ffffff; 
            text-decoration: none; 
            font-weight: 600;
            border-bottom: 2px solid #ffffff;
            padding-bottom: 2px;
            transition: all 0.3s ease;
          }
          .link-btn:hover { 
            color: #f0f0f0;
            border-bottom-color: #f0f0f0;
          }
          .code-block { 
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 1px solid #e2e8f0; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace; 
            font-size: 14px; 
            color: #2d3748;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
          }
          .code-block div {
            padding: 8px 12px;
            margin: 4px 0;
            background: #ffffff;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .footer { 
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            color: #718096; 
            padding: 30px 40px; 
            text-align: center; 
            font-size: 14px; 
            border-top: 1px solid #e2e8f0;
            position: relative;
          }
          .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 40px;
            right: 40px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #cbd5e0, transparent);
          }
          .footer p { 
            margin-bottom: 10px; 
            line-height: 1.6;
          }
          .social-links { 
            margin-top: 20px; 
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .social-links a { 
            color: #718096; 
            text-decoration: none; 
            margin: 0 12px; 
            font-size: 13px;
            font-weight: 500;
            transition: color 0.3s ease;
          }
          .social-links a:hover {
            color: ${accentColor};
          }
          ul, ol { 
            margin-left: 20px; 
            margin-bottom: 20px; 
          }
          li { 
            margin-bottom: 8px; 
            color: #4a5568;
            line-height: 1.6;
          }
          .highlight { 
            background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
            padding: 4px 8px; 
            border-radius: 6px; 
            color: #2b6cb0; 
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(49, 130, 206, 0.2);
          }
          .text-center {
            text-align: center;
          }
          .mb-0 { margin-bottom: 0; }
          .mt-0 { margin-top: 0; }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 30px 0;
          }
          @media (max-width: 600px) {
            body { padding: 10px 0; }
            .email-wrapper { margin: 0 10px; border-radius: 12px; }
            .content { padding: 30px 25px; }
            .header { padding: 35px 25px 30px; }
            .header h1 { font-size: 24px; }
            .logo-text { font-size: 28px; }
            .footer { padding: 25px 25px; }
            .btn { padding: 14px 24px; min-width: 180px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo-container">
              <div class="logo-text">SafawiNet</div>
              <div class="logo-subtitle">Enterprise Security Platform</div>
            </div>
            <h1>${title}</h1>
            <div class="subtitle">Secure • Reliable • Professional</div>
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
      <h2>🔐 Password Reset Request</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>We received a request to reset your password for your SafawiNet account. If you didn't make this request, you can safely ignore this email.</p>
      
      <div class="info-box">
        <p><strong>⏰ Security Notice:</strong> This link will expire in <span class="highlight">1 hour</span> for your protection.</p>
      </div>
      
      <div class="text-center">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <div class="warning-box">
        <h3>🚨 If you didn't request this:</h3>
        <ul>
          <li>Your account may be compromised</li>
          <li>Contact our security team immediately</li>
          <li>Review your recent account activity</li>
          <li>Change your password on other accounts if you reuse passwords</li>
        </ul>
      </div>
      
      <div class="success-box">
        <p><strong>💡 Security Tip:</strong> Use unique, strong passwords for each account and enable two-factor authentication wherever possible.</p>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Password Reset Request - SafawiNet',
      html: this.getEmailTemplate(content, 'Password Reset Request', '#dc2626', '#ef4444')
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
      <h2>🚨 Security Alert</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>We detected suspicious activity on your SafawiNet account that requires your immediate attention.</p>
      
      <div class="alert-box">
        <h3>⚠️ Alert Details:</h3>
        <p><strong>Type:</strong> ${alertData.type}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> <span class="highlight">${alertData.ip}</span></p>
        <p><strong>Device:</strong> ${alertData.device}</p>
      </div>
      
      <div class="info-box">
        <p><strong>✅ If this was you:</strong> No action is needed.</p>
        <p><strong>❌ If this wasn't you:</strong> Take immediate action below.</p>
      </div>
      
      <h3>🛡️ Recommended Actions:</h3>
      <ol>
        <li><strong>Change your password immediately</strong></li>
        <li><strong>Enable two-factor authentication</strong> if not already enabled</li>
        <li><strong>Review your recent account activity</strong></li>
        <li><strong>Contact our security team</strong> if you suspect unauthorized access</li>
        <li><strong>Check other accounts</strong> for similar suspicious activity</li>
      </ol>
      
      <div class="success-box">
        <p><strong>💡 Security Tip:</strong> Use unique, strong passwords for each of your accounts and enable 2FA wherever possible.</p>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Security Alert - SafawiNet',
      html: this.getEmailTemplate(content, 'Security Alert', '#991b1b', '#dc2626')
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
      <h2>🔐 Two-Factor Authentication Enabled</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Great news! Two-factor authentication has been successfully enabled for your SafawiNet account. Your account is now more secure than ever.</p>
      
      <div class="success-box">
        <h3>✅ 2FA Setup Complete</h3>
        <p>Your account now has an additional layer of security protection that significantly reduces the risk of unauthorized access.</p>
      </div>
      
      <h3>🔑 Backup Codes</h3>
      <p>Store these backup codes in a secure location. You can use them if you lose access to your authenticator app:</p>
      
      <div class="code-block">
        ${backupCodes.map(code => `<div>${code}</div>`).join('')}
      </div>
      
      <div class="warning-box">
        <h3>⚠️ Important Security Notes:</h3>
        <ul>
          <li>Keep your backup codes secure and private</li>
          <li>Don't share them with anyone</li>
          <li>You can generate new codes anytime from your account settings</li>
          <li>Each code can only be used once</li>
          <li>Store them in a password manager or secure note-taking app</li>
        </ul>
      </div>
      
      <div class="info-box">
        <p><strong>💡 Tip:</strong> Consider storing backup codes in a password manager or secure note-taking app for easy access when needed.</p>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Two-Factor Authentication Setup - SafawiNet',
      html: this.getEmailTemplate(content, '2FA Setup Complete', '#059669', '#10b981')
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
      <h2>🔒 Account Temporarily Locked</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Your SafawiNet account has been temporarily locked for security reasons. This is an automated security measure to protect your account.</p>
      
      <div class="warning-box">
        <h3>⚠️ Lock Details:</h3>
        <p><strong>Reason:</strong> ${lockReason}</p>
        <p><strong>Duration:</strong> <span class="highlight">30 minutes</span></p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="info-box">
        <p><strong>⏰ What happens next:</strong></p>
        <ul>
          <li>Your account will be automatically unlocked after 30 minutes</li>
          <li>You can try logging in again after the lock period</li>
          <li>No action is required from you</li>
          <li>This is a protective measure for your security</li>
        </ul>
      </div>
      
      <div class="success-box">
        <p><strong>🛡️ Security Feature:</strong> This automatic lock helps prevent unauthorized access attempts and protects your account from potential threats.</p>
      </div>
      
      <p>If you believe this lock was applied in error, please contact our support team.</p>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Account Temporarily Locked - SafawiNet',
      html: this.getEmailTemplate(content, 'Account Locked', '#92400e', '#f59e0b')
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
      <h2>🎉 Welcome to SafawiNet!</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Welcome to SafawiNet! We're excited to have you on board. Your account has been created successfully and you're now part of our secure network management platform.</p>
      
      <div class="success-box">
        <h3>✅ Account Created Successfully</h3>
        <p><strong>Username:</strong> <span class="highlight">${user.username}</span></p>
        <p><strong>Email:</strong> <span class="highlight">${user.email}</span></p>
        <p><strong>Role:</strong> <span class="highlight">${user.isAdmin ? 'Administrator' : 'User'}</span></p>
      </div>
      
      <h3>🛡️ Security Recommendations:</h3>
      <div class="info-box">
        <ol>
          <li><strong>Enable two-factor authentication</strong> for enhanced security</li>
          <li><strong>Use a strong, unique password</strong> that you don't use elsewhere</li>
          <li><strong>Keep your login credentials secure</strong> and never share them</li>
          <li><strong>Regularly review your account activity</strong> for any suspicious behavior</li>
          <li><strong>Set up backup codes</strong> for 2FA recovery</li>
        </ol>
      </div>
      
      <div class="success-box">
        <h3>🚀 Getting Started:</h3>
        <ul>
          <li>Complete your profile setup</li>
          <li>Explore the platform features</li>
          <li>Set up your security preferences</li>
          <li>Review our security guidelines</li>
          <li>Configure your notification settings</li>
        </ul>
      </div>
      
      <p>If you have any questions or need assistance, our support team is here to help!</p>
      
      <p><strong>Best regards,</strong><br>The SafawiNet Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Welcome to SafawiNet!',
      html: this.getEmailTemplate(content, 'Welcome to SafawiNet', '#1e40af', '#3b82f6')
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
      <h2>📧 Verify Your Email Address</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Please verify your email address to complete your SafawiNet account setup. This helps us ensure the security of your account.</p>
      
      <div class="info-box">
        <p><strong>⏰ Important:</strong> This verification link will expire in <span class="highlight">24 hours</span> for your protection.</p>
      </div>
      
      <div class="text-center">
        <a href="${verificationUrl}" class="btn">Verify My Email</a>
      </div>
      
      <div class="alert-box">
        <h3>🔒 Security Notice:</h3>
        <ul>
          <li>Only click this link if you created a SafawiNet account</li>
          <li>This link is unique to your account and should not be shared</li>
          <li>If you didn't create an account, please ignore this email</li>
          <li>Never share verification links with others</li>
        </ul>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Verify Your Email - SafawiNet',
      html: this.getEmailTemplate(content, 'Email Verification', '#7c3aed', '#8b5cf6')
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
      <h2>✅ Email Verified Successfully</h2>
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Your email address has been successfully verified! Your SafawiNet account is now more secure.</p>
      
      <div class="success-box">
        <h3>🎉 Verification Complete</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Verified:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="info-box">
        <h3>🛡️ Next Steps for Enhanced Security:</h3>
        <ul>
          <li><strong>Verify your phone number</strong> (if provided)</li>
          <li><strong>Enable two-factor authentication</strong></li>
          <li><strong>Review your security settings</strong></li>
          <li><strong>Set up backup codes</strong> for 2FA</li>
          <li><strong>Configure notification preferences</strong></li>
        </ul>
      </div>
      
      <div class="success-box">
        <p><strong>💡 Tip:</strong> Complete your security setup to enjoy the full benefits of our platform's protection features.</p>
      </div>
      
      <p><strong>Best regards,</strong><br>SafawiNet Security Team</p>
    `;

    const mailOptions = {
      from: `"SafawiNet Security" <${process.env.SMTP_USER || 'alinsafawi19@gmail.com'}>`,
      to: user.email,
      subject: 'Email Verified - SafawiNet',
      html: this.getEmailTemplate(content, 'Email Verified', '#059669', '#10b981')
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