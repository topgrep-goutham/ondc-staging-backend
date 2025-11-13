const db = require('../config/knex');

class CallbackController {
    async onSearch(req, res) {
        try {
            const { context, message } = req.body;

            res.status(200).json({
                message: {
                    ack: { status: 'ACK' }
                }
            });

            const transactionId = context?.transaction_id || context?.transactionId;
            const messageId = context?.message_id || context?.messageId;

            if (!transactionId) {
                console.error('❌ Missing transaction_id in context');
                return;
            }

            const data = await db('on_search_results')
                .insert({
                    transaction_id: transactionId,
                    message_id: messageId,
                    context: JSON.stringify(context),
                    message: JSON.stringify(message)
                })
                .onConflict('transaction_id')
                .merge();

        } catch (error) {
            console.error('❌ Error in on_search:', error);
        }
    }

    // Get search results by transaction ID
    async getSearchResults(transactionId) {
        try {
            if (!transactionId) {
                return { status: 'ERROR', message: 'transaction_id is required' };
            }
            const result = await db('on_search_results')
                .where('transaction_id', transactionId)
                .first();

            if (!result) {
                return {
                    status: 'PENDING',
                    message: 'Search results not received yet',
                    data: null
                };
            }

            return {
                status: 'COMPLETED',
                data: {
                    transaction_id: result.transaction_id,
                    message_id: result.message_id,
                    context: JSON.parse(result.context),
                    message: JSON.parse(result.message),
                    created_at: result.created_at
                }
            };

        } catch (error) {
            console.error('❌ getSearchResults error:', error);
            return { status: 'ERROR', message: error.message };
        }
    }
}

module.exports = new CallbackController();