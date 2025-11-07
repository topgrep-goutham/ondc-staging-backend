// const config = require('../config/config');
// const cryptoUtils = require('./crypto');

// class AuthorizationManager {
//     // Create authorization header for outgoing requests
//     async createAuthHeader(requestBody) {
//         await cryptoUtils.initialize();

//         // Generate Blake2b hash of the request body
//         const bodyString = JSON.stringify(requestBody);
//         const digest = cryptoUtils.generateBlake2bHash(bodyString);

//         const created = Math.floor(Date.now() / 1000);
//         const expires = created + 3600; // 1 hour expiry

//         // Create signing string
//         const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digest}`;

//         // Sign the string
//         const signature = await cryptoUtils.signMessage(
//             signingString,
//             config.ondc.signingPrivateKey
//         );

//         // Construct authorization header
//         const authHeader = [
//             `Signature keyId="${config.ondc.subscriberId}|${config.ondc.ukId}|ed25519"`,
//             `algorithm="ed25519"`,
//             `created="${created}"`,
//             `expires="${expires}"`,
//             `headers="(created) (expires) digest"`,
//             `signature="${signature}"`
//         ].join(',');

//         return authHeader;
//     }

//     // Verify authorization header for incoming requests
//     async verifyAuthHeader(authHeader, requestBody) {
//         try {

//             // Parse authorization header
//             const params = this.parseAuthHeader(authHeader);

//             if (!params.signature || !params.keyId) {
//                 throw new Error('Missing required authorization parameters');
//             }


//             // Extract subscriber_id and ukId from keyId
//             const [subscriberId, ukId, algorithm] = params.keyId.split('|');

//             if (algorithm !== 'ed25519') {
//                 throw new Error('Unsupported algorithm: ' + algorithm);
//             }


//             // Get public key from registry
//             const registryEntry = await this.lookupRegistry(subscriberId, ukId);

//             if (!registryEntry) {
//                 throw new Error('Subscriber not found in registry: ' + subscriberId);
//             }

//             if (registryEntry.status !== 'SUBSCRIBED') {
//                 throw new Error('Subscriber not in SUBSCRIBED status');
//             }

//             // Get signing public key
//             const signingPublicKey = registryEntry.signing_public_key;

//             if (!signingPublicKey) {
//                 throw new Error('Signing public key not found in registry');
//             }

//             // Generate digest from request body
//             const bodyString = JSON.stringify(requestBody);
//             const computedDigest = cryptoUtils.generateBlake2bHash(bodyString);

//             // Extract the expected digest from headers
//             const headersArray = params.headers.split(' ');
//             const expectedDigest = params.digest?.replace('BLAKE-512=', '') ||
//                 params.digest?.replace('BLAKE2-512=', '');

//             // Recreate signing string
//             let signingString = '';

//             if (headersArray.includes('(created)')) {
//                 signingString += `(created): ${params.created}\n`;
//             }
//             if (headersArray.includes('(expires)')) {
//                 signingString += `(expires): ${params.expires}\n`;
//             }
//             if (headersArray.includes('digest')) {
//                 signingString += `digest: BLAKE-512=${computedDigest}`;
//             }

//             // Trim trailing newline
//             signingString = signingString.trim();

//             // Verify signature
//             const isValid = await cryptoUtils.verifySignature(
//                 signingString,
//                 params.signature,
//                 signingPublicKey
//             );

//             if (!isValid) {
//                 console.error('❌ Signature verification FAILED');
//                 throw new Error('Signature verification failed');
//             }

//             console.log('✅ Signature verified successfully');

//             // Check expiry
//             if (params.expires) {
//                 const now = Math.floor(Date.now() / 1000);
//                 if (now > parseInt(params.expires)) {
//                     throw new Error('Request has expired');
//                 }
//             }

//             return { valid: true, subscriberId, ukId };

//         } catch (error) {
//             console.error('❌ Authorization verification error:', error.message);
//             return { valid: false, error: error.message };
//         }
//     }

//     // Parse authorization header
//     parseAuthHeader(authHeader) {
//         const params = {};

//         // Remove "Signature " prefix if present
//         const headerValue = authHeader.replace(/^Signature\s+/i, '');

//         // Match key="value" or key=value patterns
//         const regex = /(\w+)=["']?([^"',]+)["']?/g;
//         let match;

//         while ((match = regex.exec(headerValue)) !== null) {
//             const key = match[1];
//             const value = match[2];
//             params[key] = value;
//         }

//         return params;
//     }

//     // Lookup registry - call actual registry service
//     async lookupRegistry(subscriberId, ukId) {
//         try {
//             const registryService = require('../services/registryService');
//             const entry = await registryService.lookup(subscriberId, ukId);
//             return entry;
//         } catch (error) {
//             console.error('Registry lookup failed:', error);
//             // Return null if lookup fails
//             return null;
//         }
//     }
// }

// module.exports = new AuthorizationManager();




// const ondcCrypto = require('./ondcCrypto');
// const registryService = require('../services/registryService');

// class AuthorizationManager {
//     /**
//      * Create authorization header for outgoing requests using ONDC SDK
//      */
//     async createAuthHeader(requestBody) {
//         try {
//             const header = await ondcCrypto.createAuthHeader(requestBody);
//             return header;
//         } catch (error) {
//             console.error('Error creating authorization header:', error);
//             throw error;
//         }
//     }

//     /**
//      * Verify authorization header for incoming requests using ONDC SDK
//      */
//     async verifyAuthHeader(authHeader, requestBody) {
//         try {

//             // Parse authorization header to get subscriber info
//             const params = this.parseAuthHeader(authHeader);
//             console.log(params)

//             if (!params.signature || !params.keyId) {
//                 throw new Error('Missing required authorization parameters');
//             }

//             // Extract subscriber_id and ukId from keyId
//             const [subscriberId, ukId, algorithm] = params.keyId.split('|');

//             if (algorithm !== 'ed25519') {
//                 throw new Error('Unsupported algorithm: ' + algorithm);
//             }


//             // Get public key from registry
//             const registryEntry = await registryService.lookup(subscriberId, ukId);

//             if (!registryEntry) {
//                 throw new Error('Subscriber not found in registry: ' + subscriberId);
//             }


//             if (registryEntry.status !== 'SUBSCRIBED') {
//                 throw new Error('Subscriber not in SUBSCRIBED status');
//             }

//             // Get signing public key
//             const signingPublicKey = registryEntry.signing_public_key;

//             if (!signingPublicKey) {
//                 throw new Error('Signing public key not found in registry');
//             }


//             // Verify signature using ONDC SDK
//             const isValid = await ondcCrypto.verifyAuthHeader(
//                 authHeader,
//                 requestBody,
//                 signingPublicKey
//             );
//             console.log("isValid", isValid)

//             if (!isValid) {
//                 throw new Error('Signature verification failed');
//             }


//             // Check expiry
//             if (params.expires) {
//                 const now = Math.floor(Date.now() / 1000);
//                 if (now > parseInt(params.expires)) {
//                     throw new Error('Request has expired');
//                 }
//             }

//             return { valid: true, subscriberId, ukId };

//         } catch (error) {
//             console.log("auth error", error.message)
//             console.error('❌ Authorization verification error:', error.message);
//             return { valid: false, error: error.message };
//         }
//     }

//     /**
//      * Parse authorization header
//      */
//     parseAuthHeader(authHeader) {
//         const params = {};
//         const headerValue = authHeader.replace(/^Signature\s+/i, '');
//         const regex = /(\w+)=["']?([^"',]+)["']?/g;
//         let match;

//         while ((match = regex.exec(headerValue)) !== null) {
//             params[match[1]] = match[2];
//         }

//         return params;
//     }
// }

// module.exports = new AuthorizationManager();


// utils/authorization.js
const ondcCrypto = require('./ondcCrypto');
// ❌ remove this line:
// const registryService = require('./services/registryService');

class AuthorizationManager {
    async createAuthHeader(requestBody) {
        try {
            const header = await ondcCrypto.createAuthHeader(requestBody);
            return header;
        } catch (error) {
            console.error('Error creating authorization header:', error);
            throw error;
        }
    }

    async verifyAuthHeader(authHeader, requestBody) {
        try {
            // ✅ lazy-require here to avoid circular import
            const registryService = require('../services/registryService'); // <-- fixed path

            const params = this.parseAuthHeader(authHeader);

            if (!params.signature || !params.keyId) throw new Error('Missing required authorization parameters');

            const [subscriberId, ukId, algorithm] = params.keyId.split('|');
            console.log(subscriberId)
            if (algorithm !== 'ed25519') throw new Error('Unsupported algorithm: ' + algorithm);

            const registryEntry = await registryService.lookup(subscriberId, ukId, requestBody);
            console.log(registryEntry)
            if (!registryEntry) throw new Error('Subscriber not found in registry: ' + subscriberId);
            if (registryEntry.status !== 'SUBSCRIBED') throw new Error('Subscriber not in SUBSCRIBED status');

            const signingPublicKey = registryEntry.signing_public_key;
            if (!signingPublicKey) throw new Error('Signing public key not found in registry');

            const isValid = await ondcCrypto.verifyAuthHeader(authHeader, requestBody, signingPublicKey);
            console.log(isValid)
            if (!isValid) throw new Error('Signature verification failed');

            if (params.expires) {
                const now = Math.floor(Date.now() / 1000);
                if (now > parseInt(params.expires, 10)) throw new Error('Request has expired');
            }

            return { valid: true, subscriberId, ukId };
        } catch (error) {
            console.error('❌ Authorization verification error:', error.message);
            return { valid: false, error: error.message };
        }
    }

    parseAuthHeader(authHeader) {
        const params = {};
        const headerValue = authHeader.replace(/^Signature\s+/i, '');
        const regex = /(\w+)=["']?([^"',]+)["']?/g;
        let match;
        while ((match = regex.exec(headerValue)) !== null) params[match[1]] = match[2];
        return params;
    }
}

module.exports = new AuthorizationManager();
