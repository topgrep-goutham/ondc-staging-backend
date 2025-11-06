require('dotenv').config();

module.exports = {
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    
    ondc: {
        // Your subscriber details
        subscriberId: process.env.SUBSCRIBER_ID || 'your-domain.com',
        subscriberUrl: process.env.SUBSCRIBER_URL || 'https://your-domain.com/ondc',
        ukId: process.env.UK_ID || 'your-ukid',
        
        // Keys (from your existing code)
        encryptionPrivateKey: process.env.ENCRYPTION_PRIVATE_KEY || 'MC4CAQAwBQYDK2VuBCIEIED0OV2s3QdevvacHlRfJF3sM5RsethFHL4UiQ7/Vk1t',
        signingPrivateKey: process.env.SIGNING_PRIVATE_KEY || 'OYZUrSfWPoJLv7uC5tJM/NuQbtNtQkvfb2tR7uDo0VBEs+EdrXUzxyMPe3wYdUz2qW6Z702la3w38Eys8pez/w==',
        ondcPublicKey: process.env.ONDC_PUBLIC_KEY || 'MCowBQYDK2VuAyEAduMuZgmtpjdCuxv+Nc49K0cB6tL/Dj3HZetvVN7ZekM=',
        
        // ONDC endpoints
        registryUrl: process.env.REGISTRY_URL || 'https://staging.registry.ondc.org',
        gatewayUrl: process.env.GATEWAY_URL || 'https://staging.gateway.ondc.org',
        
        // Domain and location
        domain: process.env.DOMAIN || 'ONDC:RET10',
        country: process.env.COUNTRY || 'IND',
        city: process.env.CITY || 'std:080',
        
        // API version
        coreVersion: '1.2.5',
        
        // Request verification
        requestId: process.env.REQUEST_ID || 'c0941deb-8b89-4a12-adde-ffa5da6ada0a'
    },
    
    database: {
        // Add your database config here
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 27017,
        name: process.env.DB_NAME || 'ondc_db'
    }
};