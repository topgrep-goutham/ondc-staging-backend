const config = require('./config/config');

function verifyKeyFormat() {
    
    const privateKey = config.ondc.signingPrivateKey;
    const subscriberId = config.ondc.subscriberId;
    const ukId = config.ondc.ukId;
    
    
    if (privateKey) {
        try {
            const keyBuffer = Buffer.from(privateKey, 'base64');
            
            if (keyBuffer.length === 64) {
                console.log('✅ Key format looks correct (64 bytes Ed25519)');
            } else if (keyBuffer.length === 32) {
                console.log('⚠️  Key is 32 bytes (seed only). Need 64 bytes (seed + public key)');
            } else {
                console.log('❌ Invalid key length. Should be 64 bytes for Ed25519');
            }
        } catch (error) {
            console.log('❌ Invalid base64 encoding:', error.message);
        }
    }
    
    checkRegistration(subscriberId);
}

async function checkRegistration(subscriberId) {
    const axios = require('axios');
    
    try {
        const response = await axios.post(
            'https://staging.registry.ondc.org/lookup',
            { subscriber_id: subscriberId },
            { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.data && response.data.length > 0) {
            console.log('✅ Found in registry!');
        } else {
            console.log('❌ NOT found in registry. You need to register first!');
        }
    } catch (error) {
        console.log('❌ Registry check failed:', error.message);
    }
}

verifyKeyFormat();