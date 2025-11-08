const db = require('../config/db');

function parseJsonField(val) {
    if (!val) return null;
    try { return JSON.parse(val); } catch (e) { return null; }
}

module.exports.findOneAndUpdate = async (filter, update, options = {}) => {
    const orderId = (filter && filter.orderId) || (filter && filter.order_id);
    if (!orderId) throw new Error('orderId is required');

    const existing = await db.get('SELECT * FROM Orders WHERE orderId = ?', [orderId]);
    const now = new Date().toISOString();

    const record = existing ? {
        orderId: existing.orderId,
        transactionId: existing.transactionId,
        bppId: existing.bppId,
        bppUri: existing.bppUri,
        providerId: existing.providerId,
        items: parseJsonField(existing.items) || [],
        billing: parseJsonField(existing.billing) || null,
        fulfillment: parseJsonField(existing.fulfillment) || null,
        payment: parseJsonField(existing.payment) || null,
        quote: parseJsonField(existing.quote) || null,
        state: existing.state || 'Created',
        createdAt: existing.createdAt || now,
        updatedAt: existing.updatedAt || now,
        callbacks: parseJsonField(existing.callbacks) || []
    } : {
        orderId,
        transactionId: update.transactionId || (update.$set && update.$set.transactionId) || null,
        bppId: null,
        bppUri: null,
        providerId: null,
        items: [],
        billing: null,
        fulfillment: null,
        payment: null,
        quote: null,
        state: 'Created',
        createdAt: now,
        updatedAt: now,
        callbacks: []
    };

    // Apply direct sets
    if (update.$set) Object.assign(record, update.$set);
    if (update.items) record.items = update.items;
    if (update.quote) record.quote = update.quote;
    if (update.state) record.state = update.state;

    // Handle $push for callbacks
    if (update.$push && update.$push.callbacks) {
        record.callbacks.push(update.$push.callbacks);
    }

    // Persist
    await db.run(`INSERT OR REPLACE INTO Orders (orderId, transactionId, bppId, bppUri, providerId, items, billing, fulfillment, payment, quote, state, createdAt, updatedAt, callbacks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        record.orderId,
        record.transactionId,
        record.bppId,
        record.bppUri,
        record.providerId,
        record.items ? JSON.stringify(record.items) : null,
        record.billing ? JSON.stringify(record.billing) : null,
        record.fulfillment ? JSON.stringify(record.fulfillment) : null,
        record.payment ? JSON.stringify(record.payment) : null,
        record.quote ? JSON.stringify(record.quote) : null,
        record.state,
        record.createdAt,
        new Date().toISOString(),
        JSON.stringify(record.callbacks)
    ]);

    return Object.assign({}, record);
};

module.exports.findOne = async (filter) => {
    const orderId = (filter && filter.orderId) || (filter && filter.order_id);
    if (!orderId) return null;
    const row = await db.get('SELECT * FROM Orders WHERE orderId = ?', [orderId]);
    if (!row) return null;
    return {
        orderId: row.orderId,
        transactionId: row.transactionId,
        bppId: row.bppId,
        bppUri: row.bppUri,
        providerId: row.providerId,
        items: row.items ? JSON.parse(row.items) : [],
        billing: row.billing ? JSON.parse(row.billing) : null,
        fulfillment: row.fulfillment ? JSON.parse(row.fulfillment) : null,
        payment: row.payment ? JSON.parse(row.payment) : null,
        quote: row.quote ? JSON.parse(row.quote) : null,
        state: row.state,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        callbacks: row.callbacks ? JSON.parse(row.callbacks) : []
    };
};