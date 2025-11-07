const ondcService = require('../services/ondcService');
const SearchResult = require('../models/SearchResult');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');

class CallbackController {
    // Handle on_search callback
    async onSearch(req, res) {
        try {
            // Send ACK immediately
            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            // Process catalog asynchronously
            const { context, message } = req.body;
            const txnId = context.transaction_id || context.transactionId;
            const catalog = message.catalog || message;
            console.log('on_search context', context);
            console.log('catalog size:', catalog ? JSON.stringify(catalog).length : 0);

            // Ensure SearchResult has transactionId when upserting
            await SearchResult.findOneAndUpdate(
                { transactionId: txnId },
                { transactionId: txnId, catalog, updatedAt: new Date() },
                { upsert: true, new: true }
            );

            // Keep a basic transaction record for lifecycle tracking
            await Transaction.findOneAndUpdate(
                { transactionId: txnId },
                {
                    transactionId: txnId,
                    stage: 'search',
                    bppId: context.bpp_id || context.bppId || null,
                    bppUri: context.bpp_uri || context.bppUri || null,
                    $push: { messageIds: { messageId: context.message_id || context.messageId || '', action: context.action || 'on_search', timestamp: new Date() } }
                },
                { upsert: true }
            );

        } catch (error) {
            console.error('on_search error:', error);
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
    async getSearchResults(transactionId) {
        try {
            if (!transactionId) {
                return { status: "ERROR", message: "transaction_id is required" };
            }

            const result = await SearchResult.findOne({ transactionId });

            if (!result) {
                return {
                    status: "PENDING",
                    message: "Search results not received yet",
                    catalog: null
                };
            }

            return {
                status: "COMPLETED",
                catalog: result.catalog
            };

        } catch (error) {
            console.error("getSearchResults error:", error);
            return { status: "ERROR", message: error.message };
        }
    }
}

module.exports = new CallbackController();
