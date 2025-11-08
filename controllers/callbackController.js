const ondcService = require('../services/ondcService');
const SearchResult = require('../models/SearchResult');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config');
const db = require('../config/db');

class CallbackController {
    // Handle on_search callback
    // async onSearch(req, res) {
    //     // try {
    //     //     // Send ACK immediately
    //     //     res.status(200).json({
    //     //         message: {
    //     //             ack: { status: 'ACK' }
    //     //         }
    //     //     });

    //     //     // Process catalog asynchronously
    //     //     const { context, message } = req.body;
    //     //     const txnId = context.transaction_id || context.transactionId;
    //     //     const catalog = message.catalog || message;
    //     //     console.log('on_search context', context);
    //     //     console.log('Products:', data.message.catalog['bpp/providers'][0].items );
    //     //     console.log('catalog size:', catalog ? JSON.stringify(catalog) : 0);

    //     //     // Ensure SearchResult has transactionId when upserting
    //     //     await SearchResult.findOneAndUpdate(
    //     //         { transactionId: txnId },
    //     //         { transactionId: txnId, catalog, updatedAt: new Date() },
    //     //         { upsert: true, new: true }
    //     //     );

    //     //     // Keep a basic transaction record for lifecycle tracking
    //     //     await Transaction.findOneAndUpdate(
    //     //         { transactionId: txnId },
    //     //         {
    //     //             transactionId: txnId,
    //     //             stage: 'search',
    //     //             bppId: context.bpp_id || context.bppId || null,
    //     //             bppUri: context.bpp_uri || context.bppUri || null,
    //     //             $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_search', timestamp: new Date() } }
    //     //         },
    //     //         { upsert: true }
    //     //     );

    //     //     // If an sqlite DB is available, try to load product details for this transaction
    //     //     try {
    //     //         const dbPath = config.sqlite?.path || './ondc.bd';
    //     //         if (dbPath && txnId) {
    //     //             const fetchRows = (sql, params) => new Promise((resolve, reject) => {
    //     //                 const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
    //     //                     if (err) return reject(err);
    //     //                 });
    //     //                 db.all(sql, params, (err, rows) => {
    //     //                     db.close();
    //     //                     if (err) return reject(err);
    //     //                     resolve(rows);
    //     //                 });
    //     //             });

    //     //             const sql = 'SELECT * FROM Product_Details WHERE transaction_id = ? ORDER BY id ASC';
    //     //             const rows = await fetchRows(sql, [txnId]);
    //     //             if (rows && rows.length) {
    //     //                 const items = rows.map(r => ({
    //     //                     id: r.item_id,
    //     //                     descriptor: { name: r.item_name, code: r.item_code, images: r.image_url ? [r.image_url] : [] },
    //     //                     price: { currency: r.currency, value: r.price_value != null ? r.price_value.toString() : undefined },
    //     //                     category_id: r.category_id,
    //     //                     fulfillment_id: r.fulfillment_id,
    //     //                     location_id: r.location_id
    //     //                 }));

    //     //                 const catalogFromSql = {
    //     //                     'bpp/providers': [
    //     //                         { id: rows[0].provider_id, descriptor: { name: rows[0].provider_name }, items }
    //     //                     ]
    //     //                 };

    //     //                 await SearchResult.findOneAndUpdate(
    //     //                     { transactionId: txnId },
    //     //                     { transactionId: txnId, catalog: catalogFromSql, updatedAt: new Date() },
    //     //                     { upsert: true, new: true }
    //     //                 );
    //     //             }
    //     //         }
    //     //     } catch (sqlErr) {
    //     //         console.error('sqlite load error for on_search:', sqlErr);
    //     //     }

    //     // } catch (error) {
    //     //     console.error('on_search error:', error);
    //     // }

    //     try {
    //         const data = req.body;

    //         const txnId = data.context.transaction_id;
    //         const items = data.message.catalog['bpp/providers'][0].items || [];
    //         console.log(items)

    //         // Clear previous results for this transaction
    //         db.prepare(`DELETE FROM Product_Details WHERE transaction_id = ?`).run(txnId);

    //         // Insert current results
    //         const insert = db.prepare(`
    //         INSERT INTO Product_Details 
    //         (transaction_id, item_id, name, price, raw_json)
    //         VALUES (?, ?, ?, ?, ?)
    //     `);

    //         items.forEach(item => {
    //             insert.run(
    //                 txnId,
    //                 item.id,
    //                 item.descriptor.name,
    //                 item.price?.value || null,
    //                 JSON.stringify(item)
    //             );
    //         });

    //         res.json({ status: true });
    //     } catch (e) {
    //         res.status(500).json({ error: e.message });
    //     }
    // }

    async onSearch(req, res) {
        try {
            // ACK immediately to ONDC
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const data = req.body;

            const txnId = data.context.transaction_id;
            const providers = data.message?.catalog?.['bpp/providers'] || [];
            const items = providers[0]?.items || [];

            console.log('Transaction ID:', txnId);
            console.log('Items received:', items.length);

            if (!txnId) {
                console.error('Missing transaction_id in on_search callback');
                return;
            }

            // Delete existing rows for this transaction
            await db.run(
                `DELETE FROM Product_Details WHERE transaction_id = ?`,
                [txnId]
            );

            // Insert items in SQLite
            const insertSql = `
            INSERT INTO Product_Details 
            (transaction_id, item_id, item_name, price_value, raw_json)
            VALUES (?, ?, ?, ?, ?)
        `;

            for (const item of items) {
                await db.run(insertSql, [
                    txnId,
                    item.id || null,
                    item.descriptor?.name || null,
                    item.price?.value || null,
                    JSON.stringify(item)
                ]);
            }

            console.log(`Saved ${items.length} items to DB for transaction: ${txnId}`);

        } catch (e) {
            console.error('on_search error:', e);
        }
    }

    // Handle on_select callback
    async onSelect(req, res) {
        try {
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;

            // Store selection into Transaction.selectedItems or store quote
            const items = message.order?.items || message.items || null;
            const quote = message.order?.quote || message.quote || null;

            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                {
                    $set: {
                        stage: 'select',
                        selectedItems: items || undefined
                    },
                    $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_select', timestamp: new Date() } }
                },
                { upsert: true }
            );

            // If quote/order id present, upsert into Order as a draft with quote
            const orderId = message.order?.id || message.order_id || (message.order && (message.order.order_id || message.order.id));
            if (orderId) {
                await Order.findOneAndUpdate(
                    { orderId },
                    {
                        orderId,
                        transactionId: txnId,
                        bppId: context.bpp_id || context.bppId || null,
                        bppUri: context.bpp_uri || context.bppUri || null,
                        quote: quote || undefined,
                        items: items || undefined,
                        $push: { callbacks: { action: 'on_select', timestamp: new Date(), data: { context, message } } }
                    },
                    { upsert: true, new: true }
                );
            }

        } catch (error) {
            console.error('on_select error:', error);
        }
    }

    // Handle on_init callback
    async onInit(req, res) {
        try {
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;

            // init typically includes an order object
            const orderObj = message.order || {};
            const orderId = orderObj.id || message.order_id || orderObj.order_id;

            // Update transaction
            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                {
                    $set: { stage: 'init' },
                    $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_init', timestamp: new Date() } }
                },
                { upsert: true }
            );

            if (orderId) {
                await Order.findOneAndUpdate(
                    { orderId },
                    {
                        orderId,
                        transactionId: txnId,
                        items: orderObj.items || undefined,
                        billing: orderObj.billing || undefined,
                        fulfillment: orderObj.fulfillments || orderObj.fulfillment || undefined,
                        $push: { callbacks: { action: 'on_init', timestamp: new Date(), data: { context, message } } }
                    },
                    { upsert: true, new: true }
                );
            }

        } catch (error) {
            console.error('on_init error:', error);
        }
    }

    // Handle on_confirm callback
    async onConfirm(req, res) {
        try {
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;
            const orderObj = message.order || {};
            const orderId = orderObj.id || message.order_id || orderObj.order_id;

            // Update transaction and mark as post-order
            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                {
                    $set: { stage: 'post-order' },
                    $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_confirm', timestamp: new Date() } }
                },
                { upsert: true }
            );

            if (orderId) {
                await Order.findOneAndUpdate(
                    { orderId },
                    {
                        orderId,
                        transactionId: txnId,
                        bppId: context.bpp_id || context.bppId || null,
                        bppUri: context.bpp_uri || context.bppUri || null,
                        items: orderObj.items || undefined,
                        billing: orderObj.billing || undefined,
                        payment: orderObj.payment || undefined,
                        state: 'Accepted',
                        $push: { callbacks: { action: 'on_confirm', timestamp: new Date(), data: { context, message } } }
                    },
                    { upsert: true, new: true }
                );
            }

        } catch (error) {
            console.error('on_confirm error:', error);
        }
    }

    // Handle on_status callback
    async onStatus(req, res) {
        try {
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;
            const orderId = message.order_id || message.order?.id || message.order?.order_id;
            const status = message.status || message.state || null;

            // Update transaction history
            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                {
                    $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_status', timestamp: new Date() } }
                },
                { upsert: true }
            );

            if (orderId) {
                const update = { $push: { callbacks: { action: 'on_status', timestamp: new Date(), data: { context, message } } } };
                if (status) update.$set = { state: status };
                await Order.findOneAndUpdate({ orderId }, update, { upsert: true, new: true });
            }

        } catch (error) {
            console.error('on_status error:', error);
        }
    }

    // Handle on_cancel callback
    async onCancel(req, res) {
        try {
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;
            const orderId = message.order_id || message.order?.id || message.order?.order_id;

            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                { $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_cancel', timestamp: new Date() } } },
                { upsert: true }
            );

            if (orderId) {
                await Order.findOneAndUpdate(
                    { orderId },
                    { $set: { state: 'Cancelled' }, $push: { callbacks: { action: 'on_cancel', timestamp: new Date(), data: { context, message } } } },
                    { upsert: true, new: true }
                );
            }

        } catch (error) {
            console.error('on_cancel error:', error);
        }
    }

    // Handle on_update callback
    async onUpdate(req, res) {
        try {
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;
            const orderId = message.order?.id || message.order_id || message.order?.order_id;

            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                { $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_update', timestamp: new Date() } } },
                { upsert: true }
            );

            if (orderId) {
                await Order.findOneAndUpdate(
                    { orderId },
                    { $push: { callbacks: { action: 'on_update', timestamp: new Date(), data: { context, message } } }, $set: { updatedAt: new Date() } },
                    { upsert: true, new: true }
                );
            }

        } catch (error) {
            console.error('on_update error:', error);
        }
    }

    // Handle on_track callback
    async onTrack(req, res) {
        try {
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;
            const orderId = message.order_id || message.order?.id || message.order?.order_id;

            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                { $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_track', timestamp: new Date() } } },
                { upsert: true }
            );

            if (orderId) {
                await Order.findOneAndUpdate(
                    { orderId },
                    { $push: { callbacks: { action: 'on_track', timestamp: new Date(), data: { context, message } } } },
                    { upsert: true, new: true }
                );
            }

        } catch (error) {
            console.error('on_track error:', error);
        }
    }

    /* NEW METHOD: Used by frontend to fetch results */
    // async getSearchResults(transactionId) {
    //     try {
    //         if (!transactionId) {
    //             return { status: "ERROR", message: "transaction_id is required" };
    //         }
    //         const result = await SearchResult.findOne({ transactionId });

    //         if (!result) {
    //             return {
    //                 status: "PENDING",
    //                 message: "Search results not received yet",
    //                 catalog: null
    //             };
    //         }

    //         return {
    //             status: "COMPLETED",
    //             catalog: result.catalog
    //         };

    //     } catch (error) {
    //         console.error("getSearchResults error:", error);
    //         return { status: "ERROR", message: error.message };
    //     }
    // }

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

    async getSearchResults(transactionId) {
        try {
            if (!transactionId) {
                return { status: 'ERROR', message: 'transaction_id is required' };
            }

            const row = await db.get(
                `SELECT catalog FROM SearchResult WHERE transactionId = ?`,
                [transactionId]
            );

            if (!row) {
                return {
                    status: 'PENDING',
                    message: 'Search results not received yet',
                    catalog: null
                };
            }

            // Parse stored JSON
            const catalogObj = JSON.parse(row.catalog);

            return {
                status: 'COMPLETED',
                catalog: catalogObj
            };

        } catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }

}

module.exports = new CallbackController();
