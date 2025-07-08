# Gmail SMTP Configuration Guide

## Problem
Gmail no longer supports plain authentication with regular passwords. You need to use either:
1. **App Password** (Recommended for server applications)
2. **OAuth2** (More complex, requires Google Cloud Console setup)

## Solution: App Password (Recommended)

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable it if not already enabled

### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification** → **App passwords**
2. Select **"Mail"** as the app
3. Click **"Generate"**
4. Copy the 16-character password (format: `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
1. Open `server/.env` file
2. Replace the current `SMTP_PASS` with your new app password:
   ```
   SMTP_PASS=your16characterapppassword
   ```
   **Important:** Remove all spaces from the app password!

### Step 4: Test Configuration
Run the debug script:
```bash
cd server
node debug-email.js
```

### Step 5: Test Welcome Email
After fixing the configuration:
```bash
cd server
node test-email.js
```

## Alternative: OAuth2 Configuration

If you prefer OAuth2, you'll need to:

1. Create a Google Cloud Project
2. Enable Gmail API
3. Create OAuth2 credentials
4. Configure the email service for OAuth2

This is more complex and typically not needed for server applications.

## Troubleshooting

### Common Issues:

1. **"Missing credentials for 'PLAIN'"**
   - Solution: Use App Password instead of regular password

2. **"Invalid login"**
   - Solution: Make sure 2-Step Verification is enabled
   - Solution: Generate a new App Password

3. **"Authentication failed"**
   - Solution: Remove spaces from App Password
   - Solution: Check that the email address is correct

### Debug Commands:

```bash
# Test email configuration
node debug-email.js

# Test welcome email
node test-email.js

# Check environment variables
node -e "require('dotenv').config(); console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');"
```

## Expected Results

After successful configuration:
- ✅ Connection successful
- ✅ Test email sent successfully!
- ✅ Welcome email sent successfully!

## Security Notes

- App Passwords are specific to your application
- You can revoke them anytime from Google Account settings
- They're more secure than regular passwords
- Each app password is 16 characters long
- Never share your app password 