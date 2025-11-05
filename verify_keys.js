const config = require('./config/config');

function verifyKeyFormat() {
    console.log('Verifying ONDC Keys...\n');
    
    const privateKey = config.ondc.signingPrivateKey;
    const subscriberId = config.ondc.subscriberId;
    const ukId = config.ondc.ukId;
    
    console.log('Subscriber ID:', subscriberId);
    console.log('UK ID:', ukId);
    console.log('Private Key:', privateKey ? '✓ Set' : '✗ Missing');
    
    if (privateKey) {
        try {
            const keyBuffer = Buffer.from(privateKey, 'base64');
            console.log('Private Key Length:', keyBuffer.length, 'bytes');
            
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
    
    console.log('\nChecking if registered...');
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
            console.log('Status:', response.data[0].status);
            console.log('Type:', response.data[0].type);
            console.log('UK ID in registry:', response.data[0].ukId);
        } else {
            console.log('❌ NOT found in registry. You need to register first!');
            console.log('\nTo register, visit:');
            console.log('- Staging: Contact ONDC support');
            console.log('- Production: https://registry.ondc.org');
        }
    } catch (error) {
        console.log('❌ Registry check failed:', error.message);
    }
}

verifyKeyFormat();