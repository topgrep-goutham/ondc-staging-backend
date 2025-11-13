const axios = require('axios');
const config = require('../config/config');
const ondcCrypto = require('../utils/ondcCrypto');
const authManager = require('../utils/authorization');

class ONDCService {
    // Create context object for ONDC requests
    createContext(action, transactionId, messageId, domain, bppId = null, bppUri = null) {
        const context = {
            domain: domain || 'ONDC:RET10',
            country: config.ondc.country,
            city: config.ondc.city,
            action: action,
            core_version: '1.2.5',
            bap_id: config.ondc.subscriberId,
            bap_uri: config.ondc.subscriberUrl,
            transaction_id: transactionId,
            message_id: messageId,
            timestamp: new Date().toISOString(),
            ttl: 'PT30S'
        };

        if (bppId) context.bpp_id = bppId;
        if (bppUri) context.bpp_uri = bppUri;

        return context;
    }

    // Send ONDC request with ONDC SDK signature
    async sendRequest(endpoint, payload) {
        try {

            // Create authorization header using ONDC SDK
            // const minifiedPayload = JSON.parse(JSON.stringify(payload));
            const authHeader = await authManager.createAuthHeader(payload);


            // Send request
            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                timeout: 30000
            });


            // Check for ACK/NACK
            if (response.data.message?.ack?.status === 'NACK') {
                console.error('❌ Request rejected (NACK):', response.data.error);
                return { success: false, error: response.data.error };
            }

            return { success: true, data: response.data };

        } catch (error) {
            console.error('❌ ONDC request error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    // Search API
    async search(searchIntent) {
        console.log(searchIntent?.domain)
        const transactionId = ondcCrypto.generateTransactionId();
        const messageId = ondcCrypto.generateMessageId();
        const domain = searchIntent?.domain

        const payload = {
            "context": this.createContext('search', transactionId, messageId, domain),
            "message": {
                "intent": {
                    "item": {
                        "descriptor": {
                            "name": searchIntent.keyword || ''
                        }
                    },
                    "fulfillment": {
                        "type": 'Delivery',
                        "end": {
                            "location": {
                                "gps": searchIntent.gps || '12.9716,77.5946'
                            }
                        }
                    }
                },
                "payment": {
                    '@ondc/org/buyer_app_finder_fee_type': 'percent',
                    '@ondc/org/buyer_app_finder_fee_amount': '3'
                }
            }
        };

        const result = await this.sendRequest(
            `${config.ondc.gatewayUrl}/search`,
            payload
        );

        return { ...result };
    }

}


module.exports = new ONDCService();
