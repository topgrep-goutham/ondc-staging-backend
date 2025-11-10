// const ondcService = require('../services/ondcService');
// const SearchResult = require('../models/SearchResult');
// const Transaction = require('../models/Transaction');
// const Order = require('../models/Order');
// const sqlite3 = require('sqlite3').verbose();
// const config = require('../config/config');
// const db = require('../config/db');

// class CallbackController {
//     // Handle on_search callback
//     async onSearch(req, res) {
//         try {
//             // Send ACK immediately
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             // Process catalog asynchronously
//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;
//             const catalog = message.catalog || message;
//             console.log('on_search context', context);
//             console.log('catalog size:', data.message.catalog['bpp/providers'][0].items );
//             console.log('catalog size:', catalog ? JSON.stringify(catalog) : 0);

//             // Ensure SearchResult has transactionId when upserting
//             await SearchResult.findOneAndUpdate(
//                 { transactionId: txnId },
//                 { transactionId: txnId, catalog, updatedAt: new Date() },
//                 { upsert: true, new: true }
//             );

//             // Keep a basic transaction record for lifecycle tracking
//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 {
//                     transactionId: txnId,
//                     stage: 'search',
//                     bppId: context.bpp_id || context.bppId || null,
//                     bppUri: context.bpp_uri || context.bppUri || null,
//                     $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_search', timestamp: new Date() } }
//                 },
//                 { upsert: true }
//             );

//             // If an sqlite DB is available, try to load product details for this transaction
//             try {
//                 const dbPath = config.sqlite?.path || './ondc.bd';
//                 if (dbPath && txnId) {
//                     const fetchRows = (sql, params) => new Promise((resolve, reject) => {
//                         const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
//                             if (err) return reject(err);
//                         });
//                         db.all(sql, params, (err, rows) => {
//                             db.close();
//                             if (err) return reject(err);
//                             resolve(rows);
//                         });
//                     });

//                     const sql = 'SELECT * FROM Product_Details WHERE transaction_id = ? ORDER BY id ASC';
//                     const rows = await fetchRows(sql, [txnId]);
//                     if (rows && rows.length) {
//                         const items = rows.map(r => ({
//                             id: r.item_id,
//                             descriptor: { name: r.item_name, code: r.item_code, images: r.image_url ? [r.image_url] : [] },
//                             price: { currency: r.currency, value: r.price_value != null ? r.price_value.toString() : undefined },
//                             category_id: r.category_id,
//                             fulfillment_id: r.fulfillment_id,
//                             location_id: r.location_id
//                         }));

//                         const catalogFromSql = {
//                             'bpp/providers': [
//                                 { id: rows[0].provider_id, descriptor: { name: rows[0].provider_name }, items }
//                             ]
//                         };

//                         await SearchResult.findOneAndUpdate(
//                             { transactionId: txnId },
//                             { transactionId: txnId, catalog: catalogFromSql, updatedAt: new Date() },
//                             { upsert: true, new: true }
//                         );
//                     }
//                 }
//             } catch (sqlErr) {
//                 console.error('sqlite load error for on_search:', sqlErr);
//             }

//         } catch (error) {
//             console.error('on_search error:', error);
//         }
//     }

//     // Handle on_select callback
//     async onSelect(req, res) {
//         try {
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;

//             // Store selection into Transaction.selectedItems or store quote
//             const items = message.order?.items || message.items || null;
//             const quote = message.order?.quote || message.quote || null;

//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 {
//                     $set: {
//                         stage: 'select',
//                         selectedItems: items || undefined
//                     },
//                     $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_select', timestamp: new Date() } }
//                 },
//                 { upsert: true }
//             );

//             // If quote/order id present, upsert into Order as a draft with quote
//             const orderId = message.order?.id || message.order_id || (message.order && (message.order.order_id || message.order.id));
//             if (orderId) {
//                 await Order.findOneAndUpdate(
//                     { orderId },
//                     {
//                         orderId,
//                         transactionId: txnId,
//                         bppId: context.bpp_id || context.bppId || null,
//                         bppUri: context.bpp_uri || context.bppUri || null,
//                         quote: quote || undefined,
//                         items: items || undefined,
//                         $push: { callbacks: { action: 'on_select', timestamp: new Date(), data: { context, message } } }
//                     },
//                     { upsert: true, new: true }
//                 );
//             }

//         } catch (error) {
//             console.error('on_select error:', error);
//         }
//     }

//     // Handle on_init callback
//     async onInit(req, res) {
//         try {
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;

//             // init typically includes an order object
//             const orderObj = message.order || {};
//             const orderId = orderObj.id || message.order_id || orderObj.order_id;

//             // Update transaction
//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 {
//                     $set: { stage: 'init' },
//                     $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_init', timestamp: new Date() } }
//                 },
//                 { upsert: true }
//             );

//             if (orderId) {
//                 await Order.findOneAndUpdate(
//                     { orderId },
//                     {
//                         orderId,
//                         transactionId: txnId,
//                         items: orderObj.items || undefined,
//                         billing: orderObj.billing || undefined,
//                         fulfillment: orderObj.fulfillments || orderObj.fulfillment || undefined,
//                         $push: { callbacks: { action: 'on_init', timestamp: new Date(), data: { context, message } } }
//                     },
//                     { upsert: true, new: true }
//                 );
//             }

//         } catch (error) {
//             console.error('on_init error:', error);
//         }
//     }

//     // Handle on_confirm callback
//     async onConfirm(req, res) {
//         try {
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;
//             const orderObj = message.order || {};
//             const orderId = orderObj.id || message.order_id || orderObj.order_id;

//             // Update transaction and mark as post-order
//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 {
//                     $set: { stage: 'post-order' },
//                     $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_confirm', timestamp: new Date() } }
//                 },
//                 { upsert: true }
//             );

//             if (orderId) {
//                 await Order.findOneAndUpdate(
//                     { orderId },
//                     {
//                         orderId,
//                         transactionId: txnId,
//                         bppId: context.bpp_id || context.bppId || null,
//                         bppUri: context.bpp_uri || context.bppUri || null,
//                         items: orderObj.items || undefined,
//                         billing: orderObj.billing || undefined,
//                         payment: orderObj.payment || undefined,
//                         state: 'Accepted',
//                         $push: { callbacks: { action: 'on_confirm', timestamp: new Date(), data: { context, message } } }
//                     },
//                     { upsert: true, new: true }
//                 );
//             }

//         } catch (error) {
//             console.error('on_confirm error:', error);
//         }
//     }

//     // Handle on_status callback
//     async onStatus(req, res) {
//         try {
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;
//             const orderId = message.order_id || message.order?.id || message.order?.order_id;
//             const status = message.status || message.state || null;

//             // Update transaction history
//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 {
//                     $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_status', timestamp: new Date() } }
//                 },
//                 { upsert: true }
//             );

//             if (orderId) {
//                 const update = { $push: { callbacks: { action: 'on_status', timestamp: new Date(), data: { context, message } } } };
//                 if (status) update.$set = { state: status };
//                 await Order.findOneAndUpdate({ orderId }, update, { upsert: true, new: true });
//             }

//         } catch (error) {
//             console.error('on_status error:', error);
//         }
//     }

//     // Handle on_cancel callback
//     async onCancel(req, res) {
//         try {
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;
//             const orderId = message.order_id || message.order?.id || message.order?.order_id;

//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 { $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_cancel', timestamp: new Date() } } },
//                 { upsert: true }
//             );

//             if (orderId) {
//                 await Order.findOneAndUpdate(
//                     { orderId },
//                     { $set: { state: 'Cancelled' }, $push: { callbacks: { action: 'on_cancel', timestamp: new Date(), data: { context, message } } } },
//                     { upsert: true, new: true }
//                 );
//             }

//         } catch (error) {
//             console.error('on_cancel error:', error);
//         }
//     }

//     // Handle on_update callback
//     async onUpdate(req, res) {
//         try {
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;
//             const orderId = message.order?.id || message.order_id || message.order?.order_id;

//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 { $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_update', timestamp: new Date() } } },
//                 { upsert: true }
//             );

//             if (orderId) {
//                 await Order.findOneAndUpdate(
//                     { orderId },
//                     { $push: { callbacks: { action: 'on_update', timestamp: new Date(), data: { context, message } } }, $set: { updatedAt: new Date() } },
//                     { upsert: true, new: true }
//                 );
//             }

//         } catch (error) {
//             console.error('on_update error:', error);
//         }
//     }

//     // Handle on_track callback
//     async onTrack(req, res) {
//         try {
//             res.status(200).json({
//                 message: {
//                     ack: { status: 'ACK' }
//                 }
//             });

//             const { context, message } = req.body;
//             const txnId = context.transaction_id || context.transactionId;
//             const orderId = message.order_id || message.order?.id || message.order?.order_id;

//             await Transaction.findOneAndUpdate(
//                 { transactionId: txnId },
//                 { $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_track', timestamp: new Date() } } },
//                 { upsert: true }
//             );

//             if (orderId) {
//                 await Order.findOneAndUpdate(
//                     { orderId },
//                     { $push: { callbacks: { action: 'on_track', timestamp: new Date(), data: { context, message } } } },
//                     { upsert: true, new: true }
//                 );
//             }

//         } catch (error) {
//             console.error('on_track error:', error);
//         }
//     }

//     /* NEW METHOD: Used by frontend to fetch results */
//     // async getSearchResults(transactionId) {
//     //     try {
//     //         if (!transactionId) {
//     //             return { status: "ERROR", message: "transaction_id is required" };
//     //         }
//     //         const result = await SearchResult.findOne({ transactionId });

//     //         if (!result) {
//     //             return {
//     //                 status: "PENDING",
//     //                 message: "Search results not received yet",
//     //                 catalog: null
//     //             };
//     //         }

//     //         return {
//     //             status: "COMPLETED",
//     //             catalog: result.catalog
//     //         };

//     //     } catch (error) {
//     //         console.error("getSearchResults error:", error);
//     //         return { status: "ERROR", message: error.message };
//     //     }
//     // }

// async getSearchResults(transactionId) {
//     try {
//         if (!transactionId) return { status: 'ERROR', message: 'transaction_id is required' };

//         const rows = await db.all(`SELECT * FROM Product_Details WHERE transaction_id = ? ORDER BY id ASC`, [transactionId]);

//         if (!rows || !rows.length) {
//             return { status: 'PENDING', message: 'Search results not received yet', catalog: null };
//         }

//         // Return a simple shape the frontend already expects:
//         const items = rows.map(r => ({
//             id: r.item_id,
//             descriptor: { name: r.item_name, code: r.item_code, images: r.image_url ? [r.image_url] : [] },
//             price: { currency: r.currency, value: r.price_value?.toString() },
//             category_id: r.category_id,
//             fulfillment_id: r.fulfillment_id,
//             location_id: r.location_id,
//         }));

//         return {
//             status: 'COMPLETED',
//             catalog: {
//                 "bpp/providers": [
//                     { id: rows[0].provider_id, descriptor: { name: rows[0].provider_name }, items }
//                 ]
//             }
//         };
//     } catch (error) {
//         console.error('getSearchResults error:', error);
//         return { status: 'ERROR', message: error.message };
//     }
// }
// }

// module.exports = new CallbackController();



const searchService = require('../services/searchService');
const db = require('../config/db')
const pool = require("../config/mysql");

class CallbackController {
    // Handle on_search callback
    // async onSearch(req, res) {
    //     try {
    //         const { context, message } = req.body;

    //         console.log('📥 Received on_search callback');
    //         console.log('Context:', JSON.stringify(context, null, 2));
    //         console.log('Message:', JSON.stringify(message, null, 2));

    //         // Store search results in database
    //         await searchService.storeSearchResults(context, message);

    //         res.json({
    //             message: {
    //                 ack: {
    //                     status: 'ACK'
    //                 }
    //             }
    //         });
    //     } catch (error) {
    //         console.error('❌ Error in on_search:', error);
    //         res.status(500).json({
    //             message: {
    //                 ack: {
    //                     status: 'NACK'
    //                 }
    //             },
    //             error: {
    //                 message: error.message
    //             }
    //         });
    //     }
    // }

    async onSearch(req, res) {
        console.log("executed on search .....")
        try {
            // ACK immediately
            res.status(200).json({ message: { ack: { status: 'ACK' } } });

            const { context, message } = req.body;
            const txnId = context?.transaction_id;
            const providers = message?.catalog?.['bpp/providers'] || [];
            console.log("data from the onsearch API....", txnId, providers, context)

            if (!txnId || providers.length === 0) {
                console.warn('on_search: missing txn or providers', { txnId, providersLen: providers.length });
                return;
            }
            console.log("before....")
            const conn = await pool.getConnection();
            console.log("conn response.....", conn)
            try {
                await conn.beginTransaction();

                for (const p of providers) {
                    const items = p.items || [];
                    for (const item of items) {
                        const itemId = item.id || null;
                        const itemName = item?.descriptor?.name || null;
                        const priceValue = item?.price?.value != null ? Number(item.price.value) : null;
                        const currency = item?.price?.currency || null;
                        const qty =
                            item?.quantity?.available?.count != null
                                ? Number(item.quantity.available.count)
                                : null;
                        const imageUrl =
                            (Array.isArray(item?.descriptor?.images) && item.descriptor.images[0]) || null;
                        const rawJson = JSON.stringify(item);

                        // Upsert by (transaction_id, item_id)
                        await conn.execute(
                            `INSERT INTO Product_Details
              (transaction_id, item_id, item_name, price_value, currency, quantity_available, image_url, raw_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
              item_name = VALUES(item_name),
              price_value = VALUES(price_value),
              currency = VALUES(currency),
              quantity_available = VALUES(quantity_available),
              image_url = VALUES(image_url),
              raw_json = VALUES(raw_json),
              updated_at = CURRENT_TIMESTAMP`,
                            [txnId, itemId, itemName, priceValue, currency, qty, imageUrl, rawJson]
                        );
                    }
                }

                const data = await conn.commit();
                console.log(data)
            } catch (e) {
                await conn.rollback();
                throw e;
            } finally {
                conn.release();
            }
        } catch (error) {
            console.error('on_search error:', error);
        }
    }

    // Handle on_select callback
    async onSelect(req, res) {
        try {
            const { context, message } = req.body;

            console.log('📥 Received on_select callback');
            console.log('Context:', JSON.stringify(context, null, 2));
            console.log('Message:', JSON.stringify(message, null, 2));

            // TODO: Store select results in database
            // You can create a similar service for select, init, etc.

            res.json({
                message: {
                    ack: {
                        status: 'ACK'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error in on_select:', error);
            res.status(500).json({
                message: {
                    ack: {
                        status: 'NACK'
                    }
                },
                error: {
                    message: error.message
                }
            });
        }
    }

    // Handle on_init callback
    async onInit(req, res) {
        try {
            const { context, message } = req.body;

            console.log('📥 Received on_init callback');
            console.log('Context:', JSON.stringify(context, null, 2));
            console.log('Message:', JSON.stringify(message, null, 2));

            res.json({
                message: {
                    ack: {
                        status: 'ACK'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error in on_init:', error);
            res.status(500).json({
                message: {
                    ack: {
                        status: 'NACK'
                    }
                },
                error: {
                    message: error.message
                }
            });
        }
    }

    // Handle on_confirm callback
    async onConfirm(req, res) {
        try {
            const { context, message } = req.body;

            console.log('📥 Received on_confirm callback');
            console.log('Context:', JSON.stringify(context, null, 2));
            console.log('Message:', JSON.stringify(message, null, 2));

            res.json({
                message: {
                    ack: {
                        status: 'ACK'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error in on_confirm:', error);
            res.status(500).json({
                message: {
                    ack: {
                        status: 'NACK'
                    }
                },
                error: {
                    message: error.message
                }
            });
        }
    }

    // Handle on_status callback
    async onStatus(req, res) {
        try {
            const { context, message } = req.body;

            console.log('📥 Received on_status callback');
            console.log('Context:', JSON.stringify(context, null, 2));
            console.log('Message:', JSON.stringify(message, null, 2));

            res.json({
                message: {
                    ack: {
                        status: 'ACK'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error in on_status:', error);
            res.status(500).json({
                message: {
                    ack: {
                        status: 'NACK'
                    }
                },
                error: {
                    message: error.message
                }
            });
        }
    }

    // Handle on_cancel callback
    async onCancel(req, res) {
        try {
            const { context, message } = req.body;

            console.log('📥 Received on_cancel callback');
            console.log('Context:', JSON.stringify(context, null, 2));
            console.log('Message:', JSON.stringify(message, null, 2));

            res.json({
                message: {
                    ack: {
                        status: 'ACK'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error in on_cancel:', error);
            res.status(500).json({
                message: {
                    ack: {
                        status: 'NACK'
                    }
                },
                error: {
                    message: error.message
                }
            });
        }
    }

    // Handle on_update callback
    async onUpdate(req, res) {
        try {
            const { context, message } = req.body;

            console.log('📥 Received on_update callback');
            console.log('Context:', JSON.stringify(context, null, 2));
            console.log('Message:', JSON.stringify(message, null, 2));

            res.json({
                message: {
                    ack: {
                        status: 'ACK'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error in on_update:', error);
            res.status(500).json({
                message: {
                    ack: {
                        status: 'NACK'
                    }
                },
                error: {
                    message: error.message
                }
            });
        }
    }

    // Handle on_track callback
    async onTrack(req, res) {
        try {
            const { context, message } = req.body;

            console.log('📥 Received on_track callback');
            console.log('Context:', JSON.stringify(context, null, 2));
            console.log('Message:', JSON.stringify(message, null, 2));

            res.json({
                message: {
                    ack: {
                        status: 'ACK'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error in on_track:', error);
            res.status(500).json({
                message: {
                    ack: {
                        status: 'NACK'
                    }
                },
                error: {
                    message: error.message
                }
            });
        }
    }

    // Handle search result Get APi
    // async getSearchResults(transactionId) {
    //     try {
    //         if (!transactionId) {
    //             return { status: "ERROR", message: "transaction_id is required" };
    //         }

    //         const conn = await pool.getConnection();
    //         const [rows] = await conn.query(
    //             `SELECT item_id, item_name, price_value, currency,
    //                 quantity_available, image_url, raw_json
    //          FROM Product_Details
    //          WHERE transaction_id = ?
    //          ORDER BY id ASC`,
    //             [transactionId]
    //         );
    //         conn.release();

    //         if (!rows.length) {
    //             return { status: "PENDING", catalog: null };
    //         }

    //         const items = rows.map(r => ({
    //             id: r.item_id,
    //             descriptor: {
    //                 name: r.item_name,
    //                 images: r.image_url ? [r.image_url] : []
    //             },
    //             price: {
    //                 currency: r.currency,
    //                 value: r.price_value?.toString()
    //             },
    //             quantity_available: r.quantity_available
    //         }));

    //         return {
    //             status: "COMPLETED",
    //             catalog: {
    //                 "bpp/providers": [
    //                     {
    //                         id: "provider-001",     // optional static/provider mapping
    //                         descriptor: { name: "Provider" },
    //                         items
    //                     }
    //                 ]
    //             }
    //         };

    //     } catch (error) {
    //         console.error("getSearchResults error:", error);
    //         return { status: "ERROR", message: error.message };
    //     }
    // }

    async getSearchResults(transactionId) {
        try {
            if (!transactionId) {
                return { status: 'ERROR', message: 'transaction_id is required' };
            }

            const [rows] = await pool.execute(
                'SELECT * FROM Product_Details WHERE transaction_id = ? ORDER BY id ASC',
                [transactionId]
            );

            if (!rows || rows.length === 0) {
                return { status: 'PENDING', message: 'Search results not received yet', catalog: null };
            }

            // Build a minimal ONDC-like catalog shape for your frontend
            const items = rows.map(r => ({
                id: r.item_id,
                descriptor: {
                    name: r.item_name,
                    images: r.image_url ? [r.image_url] : []
                },
                price: {
                    currency: r.currency,
                    value: r.price_value != null ? String(r.price_value) : null
                },
                quantity: r.quantity_available != null ? { available: { count: r.quantity_available } } : undefined
            }));

            return {
                status: 'COMPLETED',
                catalog: {
                    "bpp/providers": [
                        {
                            id: "provider-unknown",
                            descriptor: { name: "Provider" },
                            items
                        }
                    ]
                }
            };
        } catch (error) {
            console.error('getSearchResults error:', error);
            return { status: 'ERROR', message: error.message };
        }
    }
}

module.exports = new CallbackController();