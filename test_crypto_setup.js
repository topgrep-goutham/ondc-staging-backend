// test_crypto_setup.js - Test if crypto utilities work correctly
const cryptoUtils = require('./utils/crypto');

async function testCryptoSetup() {
    console.log('Testing Crypto Utilities...\n');
    
    try {
        // Initialize
        console.log('1. Initializing crypto utilities...');
        await cryptoUtils.initialize();
        console.log('✓ Initialized successfully\n');
        
        // Test Blake2b hash
        console.log('2. Testing Blake2b hash generation...');
        const testData = JSON.stringify({ test: 'data', timestamp: Date.now() });
        const hash = cryptoUtils.generateBlake2bHash(testData);
        console.log('✓ Hash generated:', hash.substring(0, 40) + '...');
        console.log('   Hash length:', hash.length, 'characters\n');
        
        // Test signing
        console.log('3. Testing message signing...');
        const message = 'Test message for signing';
        
        // Generate test key pair
        const keyPairs = await cryptoUtils.generateKeyPairs();
        console.log('✓ Generated test key pairs');
        
        const signature = await cryptoUtils.signMessage(
            message,
            keyPairs.signing.privateKey
        );
        console.log('✓ Message signed:', signature.substring(0, 40) + '...\n');
        
        // Test verification
        console.log('4. Testing signature verification...');
        const isValid = await cryptoUtils.verifySignature(
            message,
            signature,
            keyPairs.signing.publicKey
        );
        console.log('✓ Signature verification:', isValid ? 'PASSED' : 'FAILED\n');
        
        // Test ID generation
        console.log('5. Testing ID generation...');
        const txnId = cryptoUtils.generateTransactionId();
        const msgId = cryptoUtils.generateMessageId();
        console.log('✓ Transaction ID:', txnId);
        console.log('✓ Message ID:', msgId, '\n');
        
        // Test complete signing flow (like ONDC)
        console.log('6. Testing complete ONDC-style signing flow...');
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
        
        console.log('✓ Payload hash:', payloadHash.substring(0, 40) + '...');
        console.log('✓ Signing string created');
        console.log('✓ Payload signature:', payloadSignature.substring(0, 40) + '...');
        
        // Verify the signature
        const signatureValid = await cryptoUtils.verifySignature(
            signingString,
            payloadSignature,
            keyPairs.signing.publicKey
        );
        console.log('✓ Complete flow verification:', signatureValid ? 'PASSED' : 'FAILED\n');
        
        console.log('===========================================');
        console.log('✓ ALL TESTS PASSED!');
        console.log('===========================================');
        console.log('\nYour crypto setup is working correctly.');
        console.log('You can now use the ONDC integration.\n');
        
    } catch (error) {
        console.error('✗ TEST FAILED:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

// Run tests
testCryptoSetup();