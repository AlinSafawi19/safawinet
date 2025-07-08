# Fix Gmail Authentication for Welcome Emails

## Current Issue
The welcome email system is working correctly, but Gmail authentication is failing with "Missing credentials for 'PLAIN'" error.

## Solution: Generate Proper Gmail App Password

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
   SMTP_PASS=your-16-character-app-password-here
   ```
3. Remove any spaces from the app password

### Step 4: Test Email Configuration
Run the email test:
```bash
cd server
node test-email.js
```

### Step 5: Reset Welcome Email Flag
After fixing the email configuration:
```bash
cd server
node reset-welcome-email.js
```

### Step 6: Test Login
Log in with username: `alin`, password: `alin123M@`

## Expected Result
- Welcome email should be sent successfully
- `welcomeEmailSent` should be set to `true`
- Console should show: "✅ Welcome email sent successfully to: alinsafawi19@gmail.com"

## Troubleshooting
- Make sure the app password is exactly 16 characters
- Remove any spaces from the app password
- Ensure 2-Step Verification is enabled
- Check that the email address is correct 