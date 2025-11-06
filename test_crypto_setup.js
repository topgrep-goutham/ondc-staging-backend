// test_crypto_setup.js - Test if crypto utilities work correctly
const cryptoUtils = require('./utils/crypto');

async function testCryptoSetup() {
    
    try {
        // Initialize
        await cryptoUtils.initialize();
        
        // Test Blake2b hash
        const testData = JSON.stringify({ test: 'data', timestamp: Date.now() });
        const hash = cryptoUtils.generateBlake2bHash(testData);
        
        // Test signing
        const message = 'Test message for signing';
        
        // Generate test key pair
        const keyPairs = await cryptoUtils.generateKeyPairs();
        
        const signature = await cryptoUtils.signMessage(
            message,
            keyPairs.signing.privateKey
        );
        
        // Test verification
        const isValid = await cryptoUtils.verifySignature(
            message,
            signature,
            keyPairs.signing.publicKey
        );
        
        // Test ID generation
        const txnId = cryptoUtils.generateTransactionId();
        const msgId = cryptoUtils.generateMessageId();
        
        // Test complete signing flow (like ONDC)
        const payload = {
            context: {
                domain: 'ONDC:RET10',
                action: 'search',
                timestamp: new Date().toISOString()
            },
            message: {
                intent: {
                    item: { descriptor: { name: 'test' } }
                }
            }
        };
        
        const payloadString = JSON.stringify(payload);
        const payloadHash = cryptoUtils.generateBlake2bHash(payloadString);
        
        const created = Math.floor(Date.now() / 1000);
        const expires = created + 3600;
        
        const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${payloadHash}`;
        
        const payloadSignature = await cryptoUtils.signMessage(
            signingString,
            keyPairs.signing.privateKey
        );
        
        
        // Verify the signature
        const signatureValid = await cryptoUtils.verifySignature(
            signingString,
            payloadSignature,
            keyPairs.signing.publicKey
        );
        
    } catch (error) {
        console.error('✗ TEST FAILED:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

// Run tests
testCryptoSetup();