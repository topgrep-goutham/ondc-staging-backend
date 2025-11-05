const {
    createAuthorizationHeader,
    isHeaderValid,
    createVLookupSignature
} = require('ondc-crypto-sdk-nodejs');
const config = require('../config/config');
const crypto = require('crypto');

class ONDCCrypto {
    constructor() {
        this.subscriberId = config.ondc.subscriberId;
        this.subscriberUniqueKeyId = config.ondc.ukId;
        this.privateKey = config.ondc.signingPrivateKey;
    }

    /**
     * Create Authorization Header for outgoing requests
     * @param {Object} body - Request body (context + message)
     * @returns {Promise<string>} Authorization header
     */
    async createAuthHeader(body) {
        try {

            const header = await createAuthorizationHeader({
                body: body,
                privateKey: this.privateKey,
                subscriberId: this.subscriberId,
                subscriberUniqueKeyId: this.subscriberUniqueKeyId
            });

            console.log(header)
            return header;

        } catch (error) {
            console.error('❌ Error creating auth header:', error.message);
            throw error;
        }
    }

    /**
     * Verify Authorization Header from incoming requests
     * @param {string} header - Authorization header from request
     * @param {Object} body - Request body
     * @param {string} publicKey - Public key of sender
     * @returns {Promise<boolean>} True if valid
     */
    async verifyAuthHeader(header, body, publicKey) {
        try {

            const isValid = await isHeaderValid({
                header: header,
                body: body,
                publicKey: publicKey
            });

            if (isValid) {
                console.log('✅ Authorization header verified');
            } else {
                console.error('❌ Authorization header verification failed');
            }

            return isValid;

        } catch (error) {
            console.error('❌ Error verifying auth header:', error.message);
            return false;
        }
    }

    /**
     * Create vLookup signature for registry lookup
     * @param {Object} params - vLookup parameters
     * @returns {Promise<string>} Signature
     */
    async createVLookupSignature(params) {
        try {
            const signature = await createVLookupSignature({
                country: params.country || config.ondc.country,
                domain: params.domain || config.ondc.domain,
                type: params.type || 'sellerApp',
                city: params.city || config.ondc.city,
                subscriber_id: params.subscriber_id || this.subscriberId,
                privateKey: this.privateKey
            });

            return signature;

        } catch (error) {
            console.error('❌ Error creating vLookup signature:', error.message);
            throw error;
        }
    }

    /**
     * Generate random IDs
     */
    generateTransactionId() {
        return `${crypto.randomUUID()}`;
    }

    generateMessageId() {
        return `${crypto.randomUUID()}`;
    }
}

module.exports = new ONDCCrypto();