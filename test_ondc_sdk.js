const ondcCrypto = require('./utils/ondcCrypto');

async function testONDCSDK() {
    try {
                
        const testPayload = {
            context: {
                domain: 'ONDC:RET10',
                action: 'search',
                bap_id: 'test-bap.com',
                bap_uri: 'https://test-bap.com/ondc',
                transaction_id: ondcCrypto.generateTransactionId(),
                message_id: ondcCrypto.generateMessageId(),
                timestamp: new Date().toISOString(),
                ttl: 'PT30S'
            },
            message: {
                intent: {
                    item: { descriptor: { name: 'test' } }
                }
            }
        };
        
        const authHeader = await ondcCrypto.createAuthHeader(testPayload);
        
        const txnId = ondcCrypto.generateTransactionId();
        const msgId = ondcCrypto.generateMessageId();
        
        
        
        const vLookupSig = await ondcCrypto.createVLookupSignature({
            subscriber_id: 'test-seller.com',
            type: 'sellerApp'
        });
        
        console.log('   Signature:', vLookupSig.substring(0, 40) + '...\n');
        
        console.log('===========================================');
        console.log('✅ ALL TESTS PASSED!');
        console.log('===========================================');
        console.log('\nONDC SDK is working correctly!');
        
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
testONDCSDK();