const geolocationService = require('./services/geolocationService');

async function testGeolocation() {
    console.log('🧪 Testing Geolocation Service...\n');

    // Test IPs
    const testIPs = [
        '8.8.8.8',           // Google DNS (US)
        '1.1.1.1',           // Cloudflare DNS (US)
        '208.67.222.222',    // OpenDNS (US)
        '127.0.0.1',         // Localhost
        '192.168.1.1',       // Private IP
        '10.0.0.1',          // Private IP
        '172.16.0.1',        // Private IP
        '::1',               // IPv6 localhost
        'invalid-ip',        // Invalid IP
        null                 // Null IP
    ];

    for (const ip of testIPs) {
        console.log(`📍 Testing IP: ${ip || 'null'}`);
        try {
            const location = await geolocationService.getLocationFromIP(ip);
            console.log('   Result:', JSON.stringify(location, null, 2));
        } catch (error) {
            console.log('   Error:', error.message);
        }
        console.log('');
    }

    // Test risk assessment
    console.log('🔍 Testing Risk Assessment...\n');
    try {
        const riskLocation = await geolocationService.getLocationWithRiskAssessment('8.8.8.8');
        console.log('Risk Assessment for 8.8.8.8:', JSON.stringify(riskLocation, null, 2));
    } catch (error) {
        console.log('Risk Assessment Error:', error.message);
    }

    // Test cache stats
    console.log('\n📊 Cache Statistics:');
    const cacheStats = geolocationService.getCacheStats();
    console.log(JSON.stringify(cacheStats, null, 2));

    console.log('\n✅ Geolocation service test completed!');
}

// Run the test
testGeolocation().catch(console.error); 