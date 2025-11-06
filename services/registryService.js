// const axios = require('axios');
// const config = require('../config/config');
// const authManager = require('../utils/authorization');

// class RegistryService {
//     constructor() {
//         this.cache = new Map();
//         this.cacheTimeout = 3600000; // 1 hour
//         this.startCacheRefresh();
//     }

//     // Lookup subscriber in registry
//     async lookup(subscriberId, ukId) {
//         const cacheKey = `${subscriberId}:${ukId}`;

//         // Check cache first
//         if (this.cache.has(cacheKey)) {
//             const cached = this.cache.get(cacheKey);
//             if (Date.now() - cached.timestamp < this.cacheTimeout) {
//                 console.log('✓ Registry lookup (cached):', subscriberId);
//                 return cached.data;
//             }
//         }

//         try {
//             console.log('📡 Fetching from registry:', subscriberId, ukId);

//             // Call registry API without auth for lookup
//             console.log(process.env.SIGNING_PUBLIC_KEY)
//             const lookupData = {
//                 subscriber_id: subscriberId,
//                 status: 'SUBSCRIBED',
//                 type: 'BAP',
//                 signing_public_key: process.env.SIGNING_PUBLIC_KEY
//             };

//             if (ukId) {
//                 lookupData.ukId = ukId;
//             }

//             const response = await axios.post(
//                 `${config.ondc.registryUrl}/lookup`,
//                 lookupData,
//                 {
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     timeout: 10000
//                 }
//             );

//             if (response.data && response.data.length > 0) {
//                 const entry = response.data[0];

//                 console.log('✓ Registry entry found:', {
//                     subscriber_id: entry.subscriber_id,
//                     type: entry.type,
//                     status: entry.status
//                 });

//                 // Cache the result
//                 this.cache.set(cacheKey, {
//                     data: entry,
//                     timestamp: Date.now()
//                 });

//                 return entry;
//             }

//             console.warn('⚠ No registry entry found for:', subscriberId);
//             return null;

//         } catch (error) {
//             console.error('❌ Registry lookup error:', error.response?.data || error.message);

//             // Try to return cached data even if expired
//             if (this.cache.has(cacheKey)) {
//                 console.log('⚠ Using expired cache for:', subscriberId);
//                 return this.cache.get(cacheKey).data;
//             }

//             return null;
//         }
//     }

//     // Periodic cache refresh
//     startCacheRefresh() {
//         setInterval(() => {
//             this.refreshCache();
//         }, this.cacheTimeout);
//     }

//     async refreshCache() {
//         console.log('Refreshing registry cache...');
//         const entries = Array.from(this.cache.entries());

//         for (const [key, value] of entries) {
//             const [subscriberId, ukId] = key.split(':');
//             try {
//                 await this.lookup(subscriberId, ukId);
//             } catch (error) {
//                 console.error(`Failed to refresh cache for ${key}:`, error.message);
//             }
//         }
//     }

//     // Clear cache
//     clearCache() {
//         this.cache.clear();
//     }
// }

// module.exports = new RegistryService();

const axios = require('axios');
const config = require('../config/config');
const ondcCrypto = require('../utils/ondcCrypto');
const authManager = require('../utils/authorization');

class RegistryService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 3600000; // 1 hour
        this.startCacheRefresh();
    }

    /**
     * Lookup subscriber in registry
     */
    async lookup(subscriberId, ukId) {
        const cacheKey = `${subscriberId}:${ukId || 'default'}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {

            // Call registry API
            const lookupData = {
                'subscriber_id': subscriberId,
                'type': 'BPP'
            };

            const authHeader = await authManager.createAuthHeader(lookupData);

            if (ukId) {
                lookupData.ukId = ukId;
            }

            const response = await axios.post(
                `${config.ondc.registryUrl}/v2.0/lookup`,
                lookupData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    },
                    timeout: 10000
                }
            );

            if (response.data && response.data.length > 0) {
                const entry = response.data[0];


                // Cache the result
                this.cache.set(cacheKey, {
                    data: entry,
                    timestamp: Date.now()
                });

                return entry;
            }

            console.warn('⚠ No registry entry found for:', subscriberId);
            return null;

        } catch (error) {
            console.error('❌ Registry lookup error:', error.response?.data || error.message);

            // Try to return cached data even if expired
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey).data;
            }

            return null;
        }
    }

    /**
     * vLookup - Advanced registry lookup with signature
     */
    async vLookup(params) {
        try {

            // Create vLookup signature using ONDC SDK
            const signature = await ondcCrypto.createVLookupSignature({
                country: params.country || config.ondc.country,
                domain: params.domain || config.ondc.domain,
                type: params.type || 'sellerApp',
                city: params.city || config.ondc.city,
                subscriber_id: params.subscriber_id,
            });

            const vLookupPayload = {
                sender_subscriber_id: config.ondc.subscriberId,
                request_id: ondcCrypto.generateMessageId(),
                timestamp: new Date().toISOString(),
                search_parameters: {
                    domain: params.domain || config.ondc.domain,
                    subscriber_id: params.subscriber_id,
                    country: params.country || config.ondc.country,
                    type: params.type || 'sellerApp',
                    city: params.city || config.ondc.city
                },
                signature: signature
            };

            const response = await axios.post(
                `${config.ondc.registryUrl}/vlookup`,
                vLookupPayload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            return response.data;

        } catch (error) {
            console.log("lookup error", error.message)
            console.error('❌ vLookup error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Periodic cache refresh
    startCacheRefresh() {
        setInterval(() => {
            this.refreshCache();
        }, this.cacheTimeout);
    }

    async refreshCache() {
        const entries = Array.from(this.cache.entries());

        for (const [key, value] of entries) {
            const [subscriberId, ukId] = key.split(':');
            try {
                await this.lookup(subscriberId, ukId === 'default' ? null : ukId);
            } catch (error) {
                console.error(`Failed to refresh cache for ${key}:`, error.message);
            }
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = new RegistryService();