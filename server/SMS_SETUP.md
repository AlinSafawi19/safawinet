# SMS Setup Guide - Twilio Configuration

## Overview

This guide will help you set up Twilio for SMS verification in the SafawiNet application. Twilio is a cloud communications platform that provides SMS services.

## Prerequisites

1. **Twilio Account**: Sign up for a free Twilio account at [twilio.com](https://www.twilio.com)
2. **Verified Phone Number**: You'll need a verified phone number to receive SMS (for testing)
3. **Credit Card**: Twilio requires a credit card for verification (free tier available)

## Step-by-Step Setup

### 1. Create Twilio Account

1. Go to [twilio.com](https://www.twilio.com)
2. Click "Sign up for free"
3. Fill in your details and verify your email
4. Add a credit card for verification (required for free tier)

### 2. Get Your Twilio Credentials

1. Log into your Twilio Console
2. Note your **Account SID** (found on the dashboard)
3. Note your **Auth Token** (found on the dashboard)
4. Keep these credentials secure - they provide access to your Twilio account

### 3. Get a Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click **Get a trial number** (free tier)
3. Choose a number that supports SMS capabilities
4. Note the phone number (format: +1234567890)

### 4. Configure Environment Variables

Add these variables to your `.env` file in the server directory:

```bash
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid-from-twilio-console
TWILIO_AUTH_TOKEN=your-auth-token-from-twilio-console
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### 5. Test Your Configuration

1. Start your server
2. Check server logs for "SMS service initialized with Twilio"
3. Test phone verification in the dashboard

## Free Tier Limitations

- **SMS Credits**: $15-20 worth of free credits
- **Phone Numbers**: 1 trial number
- **SMS Cost**: ~$0.0075 per SMS (US numbers)
- **International**: Higher costs for international numbers

## Production Considerations

### Upgrade to Paid Account
1. Upgrade your Twilio account for production use
2. Purchase additional phone numbers if needed
3. Set up billing alerts to monitor costs

### Phone Number Requirements
- Use a dedicated phone number for your application
- Consider purchasing multiple numbers for different regions
- Ensure the number supports SMS capabilities

### Security Best Practices
1. **Environment Variables**: Never commit credentials to version control
2. **Access Control**: Use Twilio's access control features
3. **Monitoring**: Set up alerts for unusual SMS activity
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## Troubleshooting

### Common Issues

#### 1. "SMS service initialization failed"
- **Cause**: Missing Twilio credentials
- **Solution**: Check that all three environment variables are set

#### 2. "Failed to send verification code"
- **Cause**: Invalid phone number format
- **Solution**: Ensure phone numbers include country code (+1 for US)

#### 3. "SMS not delivered"
- **Cause**: Insufficient Twilio credits
- **Solution**: Check your Twilio account balance

#### 4. "Invalid phone number"
- **Cause**: Phone number doesn't match expected format
- **Solution**: Use international format (+1234567890)

### Testing SMS Delivery

1. **Use Real Phone Numbers**: Test with actual phone numbers
2. **Check Twilio Logs**: Monitor SMS delivery in Twilio Console
3. **Verify Format**: Ensure phone numbers include country code

## Cost Optimization

### Free Tier Usage
- Use free tier for development and testing
- Monitor usage to stay within limits
- Upgrade before going to production

### Production Optimization
1. **Bulk SMS**: Consider Twilio's bulk SMS features
2. **Geographic Optimization**: Use local numbers for better delivery
3. **Message Templates**: Pre-approve message templates for faster delivery

## Security Notes

1. **Credential Protection**: Never expose Twilio credentials
2. **Phone Validation**: Always validate phone numbers before sending
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Monitor SMS activity for suspicious patterns

## Support Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Support](https://support.twilio.com)
- [Twilio Console](https://console.twilio.com)
- [SMS Best Practices](https://www.twilio.com/docs/sms/best-practices)

## Next Steps

1. **Test thoroughly** with real phone numbers
2. **Monitor costs** and set up billing alerts
3. **Implement rate limiting** to prevent abuse
4. **Set up monitoring** for SMS delivery success rates
5. **Consider backup SMS providers** for production reliability 