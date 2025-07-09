const axios = require('axios');

class GeolocationService {
    constructor() {
        this.baseUrl = 'https://ipapi.co';
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Get location information from IP address using ipapi.co
     * @param {string} ip - IP address to geolocate
     * @returns {Promise<Object>} Location information
     */
    async getLocationFromIP(ip) {
        if (!ip) {
            return this.getDefaultLocation();
        }

        // Handle localhost and private IPs
        if (this.isPrivateIP(ip)) {
            return this.getLocalLocation();
        }

        // Check cache first
        const cacheKey = `ip_${ip}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await axios.get(`${this.baseUrl}/${ip}/json/`, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'SafawiNet-Security/1.0'
                }
            });

            if (response.status === 200 && response.data) {
                const locationData = this.parseLocationData(response.data);
                
                // Cache the result
                this.cache.set(cacheKey, {
                    data: locationData,
                    timestamp: Date.now()
                });

                return locationData;
            } else {
                console.warn(`Geolocation API returned status ${response.status} for IP: ${ip}`);
                return this.getDefaultLocation();
            }
        } catch (error) {
            console.error(`Geolocation error for IP ${ip}:`, error.message);
            
            // If it's a rate limit error, return default location
            if (error.response && error.response.status === 429) {
                console.warn('Geolocation API rate limit reached, using default location');
            }
            
            return this.getDefaultLocation();
        }
    }

    /**
     * Parse location data from API response
     * @param {Object} apiData - Raw API response data
     * @returns {Object} Parsed location data
     */
    parseLocationData(apiData) {
        return {
            country: apiData.country_name || 'Unknown',
            countryCode: apiData.country_code || 'Unknown',
            region: apiData.region || 'Unknown',
            regionCode: apiData.region_code || 'Unknown',
            city: apiData.city || 'Unknown',
            latitude: apiData.latitude || null,
            longitude: apiData.longitude || null,
            timezone: apiData.timezone || 'Unknown',
            isp: apiData.org || 'Unknown',
            asn: apiData.asn || 'Unknown',
            accuracy: 'high'
        };
    }

    /**
     * Check if IP is private/local
     * @param {string} ip - IP address to check
     * @returns {boolean} True if private IP
     */
    isPrivateIP(ip) {
        if (!ip) return true;
        
        // IPv4 private ranges
        const privateRanges = [
            /^10\./,                    // 10.0.0.0/8
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
            /^192\.168\./,              // 192.168.0.0/16
            /^127\./,                   // 127.0.0.0/8 (localhost)
            /^169\.254\./,              // 169.254.0.0/16 (link-local)
            /^::1$/,                    // IPv6 localhost
            /^fc00:/,                   // IPv6 unique local
            /^fe80:/                    // IPv6 link-local
        ];

        return privateRanges.some(range => range.test(ip));
    }

    /**
     * Get location data for private/local IPs
     * @returns {Object} Local location data
     */
    getLocalLocation() {
        return {
            country: 'Local Network',
            countryCode: 'LOCAL',
            region: 'Local',
            regionCode: 'LOCAL',
            city: 'Local Network',
            latitude: null,
            longitude: null,
            timezone: 'Local',
            isp: 'Local Network',
            asn: 'Local',
            accuracy: 'local'
        };
    }

    /**
     * Get default location for unknown IPs
     * @returns {Object} Default location data
     */
    getDefaultLocation() {
        return {
            country: 'Unknown',
            countryCode: 'UNKNOWN',
            region: 'Unknown',
            regionCode: 'UNKNOWN',
            city: 'Unknown',
            latitude: null,
            longitude: null,
            timezone: 'Unknown',
            isp: 'Unknown',
            asn: 'Unknown',
            accuracy: 'unknown'
        };
    }

    /**
     * Get location with risk assessment
     * @param {string} ip - IP address
     * @param {Object} userLocation - User's known location (optional)
     * @returns {Promise<Object>} Location with risk assessment
     */
    async getLocationWithRiskAssessment(ip, userLocation = null) {
        const location = await this.getLocationFromIP(ip);
        
        if (location.accuracy === 'local') {
            return {
                ...location,
                riskLevel: 'low',
                riskFactors: ['local_network']
            };
        }

        if (location.accuracy === 'unknown') {
            return {
                ...location,
                riskLevel: 'medium',
                riskFactors: ['unknown_location']
            };
        }

        // Check for suspicious patterns
        const riskFactors = [];
        let riskLevel = 'low';

        // Check for VPN/Proxy indicators
        if (location.isp && (
            location.isp.toLowerCase().includes('vpn') ||
            location.isp.toLowerCase().includes('proxy') ||
            location.isp.toLowerCase().includes('tor') ||
            location.isp.toLowerCase().includes('anonymous')
        )) {
            riskFactors.push('vpn_proxy_detected');
            riskLevel = 'medium';
        }

        // Check for unusual country (if user location is known)
        if (userLocation && userLocation.country && 
            location.country !== userLocation.country &&
            location.country !== 'Unknown') {
            riskFactors.push('unusual_country');
            riskLevel = 'high';
        }

        // Check for high-risk countries (customize based on your security policy)
        const highRiskCountries = ['XX', 'YY']; // Add countries as needed
        if (location.countryCode && highRiskCountries.includes(location.countryCode)) {
            riskFactors.push('high_risk_country');
            riskLevel = 'high';
        }

        return {
            ...location,
            riskLevel,
            riskFactors
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        const validEntries = entries.filter(([key, value]) => 
            now - value.timestamp < this.cacheTimeout
        );

        return {
            totalEntries: entries.length,
            validEntries: validEntries.length,
            expiredEntries: entries.length - validEntries.length,
            cacheTimeout: this.cacheTimeout
        };
    }
}

module.exports = new GeolocationService(); 