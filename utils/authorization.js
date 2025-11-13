const ondcCrypto = require('./ondcCrypto');

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
            if (algorithm !== 'ed25519') throw new Error('Unsupported algorithm: ' + algorithm);

            const registryEntry = await registryService.lookup(subscriberId, ukId, requestBody);
            if (!registryEntry) throw new Error('Subscriber not found in registry: ' + subscriberId);
            if (registryEntry.status !== 'SUBSCRIBED') throw new Error('Subscriber not in SUBSCRIBED status');

            const signingPublicKey = registryEntry.signing_public_key;
            if (!signingPublicKey) throw new Error('Signing public key not found in registry');

            const isValid = await ondcCrypto.verifyAuthHeader(authHeader, requestBody, signingPublicKey);
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
