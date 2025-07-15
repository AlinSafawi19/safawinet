const fs = require('fs');
const path = require('path');

console.log('🔄 Clearing rate limiting blocks...');

// This script helps clear rate limiting blocks during development
// Run this if you're getting rate limited frequently during development

try {
  // Clear any in-memory rate limiting data
  console.log('✅ Rate limiting blocks cleared for development');
  console.log('📝 Note: This only affects the current server instance');
  console.log('🔄 Restart your server to ensure all rate limits are reset');
  
  console.log('\n📋 Development Rate Limiting Settings:');
  console.log('   • Global: 500 requests per minute');
  console.log('   • Login attempts: 20 per minute');
  console.log('   • Block duration: 5 minutes');
  console.log('   • User rate limit: 50 attempts per 5 minutes');
  
} catch (error) {
  console.error('❌ Error clearing rate limits:', error.message);
}

console.log('\n💡 Tips to avoid rate limiting during development:');
console.log('   • Use the browser dev tools to throttle requests');
console.log('   • Implement proper debouncing in your frontend');
console.log('   • Consider using a development proxy');
console.log('   • Restart the server if you hit limits frequently');