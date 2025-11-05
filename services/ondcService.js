// const axios = require('axios');
// const config = require('../config/config');
// const cryptoUtils = require('../utils/crypto');
// const authManager = require('../utils/authorization');
// const { configDotenv } = require('dotenv');

// class ONDCService {
//     // Create context object for ONDC requests
//     createContext(action, transactionId, messageId, bppId = null, bppUri = null) {
//         const context = {
//             domain: config.ondc.domain,
//             country: config.ondc.country,
//             city: config.ondc.city,
//             action: action,
//             core_version: '1.2.5', // Updated to 1.2.5
//             bap_id: config.ondc.subscriberId,
//             bap_uri: config.ondc.subscriberUrl,
//             transaction_id: transactionId,
//             message_id: messageId,
//             timestamp: new Date().toISOString(),
//             ttl: 'PT30S'
//         };

//         if (bppId) context.bpp_id = bppId;
//         if (bppUri) context.bpp_uri = bppUri;

//         return context;
//     }

//     // Send ONDC request
//     async sendRequest(endpoint, payload) {
//         try {
//             // Create authorization header
//             const authHeader = await authManager.createAuthHeader(payload);

//             // Send request
//             const response = await axios.post(endpoint, payload, {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': authHeader
//                 },
//                 timeout: 30000
//             });
//             console.log(response.data)

//             // Check for ACK/NACK
//             if (response.data.message?.ack?.status === 'NACK') {
//                 console.error('Request rejected (NACK):', response.data.error);
//                 return { success: false, error: response.data.error };
//             }

//             return { success: true, data: response.data };

//         } catch (error) {
//             console.error('ONDC request error:', error.message);
//             return { success: false, error: error.message };
//         }
//     }

//     // ===== PRE-ORDER APIS =====

//     // Search API
//     async search(searchIntent) {
//         const transactionId = cryptoUtils.generateTransactionId();
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext('search', transactionId, messageId),
//             message: {
//                 intent: {
//                     item: {
//                         descriptor: {
//                             name: searchIntent.keyword || ''
//                         }
//                     },
//                     fulfillment: {
//                         type: 'Delivery',
//                         end: {
//                             location: {
//                                 gps: searchIntent.gps || '12.9716,77.5946'
//                             }
//                         }
//                     },
//                     payment: {
//                         '@ondc/org/buyer_app_finder_fee_type': 'percent',
//                         '@ondc/org/buyer_app_finder_fee_amount': '3'
//                     }
//                 }
//             }
//         };

//         const result = await this.sendRequest(
//             `${config.ondc.gatewayUrl}/search`,
//             payload
//         );

//         return { ...result, transactionId, messageId };
//     }

//     // Select API
//     async select(selectData) {
//         const transactionId = cryptoUtils.generateTransactionId();
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext(
//                 'select',
//                 transactionId,
//                 messageId,
//                 selectData.bppId,
//                 selectData.bppUri
//             ),
//             message: {
//                 order: {
//                     provider: { id: selectData.providerId },
//                     items: selectData.items.map(item => ({
//                         id: item.id,
//                         quantity: { count: item.quantity }
//                     })),
//                     fulfillments: selectData.fulfillments || [{
//                         end: {
//                             location: {
//                                 gps: selectData.gps || '12.9716,77.5946',
//                                 address: { area_code: selectData.areaCode || '560001' }
//                             },
//                             contact: {
//                                 email: selectData.email || 'buyer@example.com',
//                                 phone: selectData.phone || '9999999999'
//                             }
//                         }
//                     }]
//                 }
//             }
//         };

//         const result = await this.sendRequest(`${selectData.bppUri}/select`, payload);
//         return { ...result, transactionId, messageId };
//     }


//     // Init API
//     async init(initData) {
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext(
//                 'init',
//                 initData.transactionId,
//                 messageId,
//                 initData.bppId,
//                 initData.bppUri
//             ),
//             message: {
//                 order: {
//                     provider: { id: initData.providerId },
//                     items: initData.items,
//                     billing: initData.billing,
//                     fulfillments: initData.fulfillments
//                 }
//             }
//         };

//         const result = await this.sendRequest(initData.bppUri + '/init', payload);
//         return { ...result, messageId };
//     }

//     // Confirm API
//     async confirm(confirmData) {
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext(
//                 'confirm',
//                 confirmData.transactionId,
//                 messageId,
//                 confirmData.bppId,
//                 confirmData.bppUri
//             ),
//             message: {
//                 order: {
//                     provider: { id: confirmData.providerId },
//                     items: confirmData.items,
//                     billing: confirmData.billing,
//                     fulfillments: confirmData.fulfillments,
//                     payment: confirmData.payment
//                 }
//             }
//         };

//         const result = await this.sendRequest(confirmData.bppUri + '/confirm', payload);
//         return { ...result, messageId };
//     }

//     // ===== POST-ORDER APIS =====

//     // Status API
//     async status(orderId, bppUri, bppId) {
//         const transactionId = cryptoUtils.generateTransactionId();
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext('status', transactionId, messageId, bppId, bppUri),
//             message: {
//                 order_id: orderId
//             }
//         };

//         return await this.sendRequest(bppUri + '/status', payload);
//     }

//     // Cancel API
//     async cancel(orderId, cancellationData, bppUri, bppId) {
//         const transactionId = cryptoUtils.generateTransactionId();
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext('cancel', transactionId, messageId, bppId, bppUri),
//             message: {
//                 order_id: orderId,
//                 cancellation_reason_id: cancellationData.reasonId,
//                 descriptor: {
//                     short_desc: cancellationData.description
//                 }
//             }
//         };

//         return await this.sendRequest(bppUri + '/cancel', payload);
//     }

//     // Update API
//     async update(orderId, updateData, bppUri, bppId) {
//         const transactionId = cryptoUtils.generateTransactionId();
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext('update', transactionId, messageId, bppId, bppUri),
//             message: {
//                 update_target: updateData.target || 'order',
//                 order: {
//                     id: orderId,
//                     ...updateData.order
//                 }
//             }
//         };

//         return await this.sendRequest(bppUri + '/update', payload);
//     }

//     // Track API
//     async track(orderId, bppUri, bppId) {
//         const transactionId = cryptoUtils.generateTransactionId();
//         const messageId = cryptoUtils.generateMessageId();

//         const payload = {
//             context: this.createContext('track', transactionId, messageId, bppId, bppUri),
//             message: {
//                 order_id: orderId
//             }
//         };

//         return await this.sendRequest(bppUri + '/track', payload);
//     }
// }

// module.exports = new ONDCService();

const axios = require('axios');
const config = require('../config/config');
const ondcCrypto = require('../utils/ondcCrypto');
const authManager = require('../utils/authorization');

class ONDCService {
    // Create context object for ONDC requests
    createContext(action, transactionId, messageId, bppId = null, bppUri = null) {
        const context = {
            domain: config.ondc.domain,
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
            console.log(`\n📤 Sending ${payload.context.action} request to:`, endpoint);
            console.log('Transaction ID:', payload.context.transaction_id);
            console.log('Message ID:', payload.context.message_id);

            // Create authorization header using ONDC SDK
            const authHeader = await authManager.createAuthHeader(payload);

            console.log('Auth header created:', authHeader.substring(0, 100) + '...');

            // Send request
            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                timeout: 30000
            });

            console.log('✅ Request sent successfully');

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
        const transactionId = ondcCrypto.generateTransactionId();
        const messageId = ondcCrypto.generateMessageId();

        const payload = {
            context: this.createContext('search', transactionId, messageId),
            message: {
                intent: {
                    item: {
                        descriptor: {
                            name: searchIntent.keyword || ''
                        }
                    },
                    fulfillment: {
                        type: 'Delivery',
                        end: {
                            location: {
                                gps: searchIntent.gps || '12.9716,77.5946'
                            }
                        }
                    },
                    payment: {
                        '@ondc/org/buyer_app_finder_fee_type': 'percent',
                        '@ondc/org/buyer_app_finder_fee_amount': '3'
                    }
                }
            }
        };

        const result = await this.sendRequest(
            `${config.ondc.gatewayUrl}/search`,
            payload
        );

        return { ...result, transactionId, messageId, payload };
    }

    // Select, Init, Confirm, Status, Cancel, Update, Track APIs
    // (Keep all other methods from previous ondc-service-corrected artifact)
    // Just replace cryptoUtils.generateTransactionId() with ondcCrypto.generateTransactionId()
    // And cryptoUtils.generateMessageId() with ondcCrypto.generateMessageId()
}

module.exports = new ONDCService();
