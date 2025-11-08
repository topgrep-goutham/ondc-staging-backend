const db = require('../config/db');

function parseJsonField(val) {
    if (!val) return null;
    try { return JSON.parse(val); } catch (e) { return null; }
}

module.exports.findOneAndUpdate = async (filter, update, options = {}) => {
    const txnId = filter.transactionId || filter.transaction_id;
    if (!txnId) throw new Error('transactionId is required');

    const existing = await db.get('SELECT * FROM Transactions WHERE transactionId = ?', [txnId]);
    const now = new Date().toISOString();

    // Start with existing data
    const record = existing ? {
        transactionId: existing.transactionId,
        messageIds: parseJsonField(existing.messageIds) || [],
        stage: existing.stage,
        bppId: existing.bppId,
        bppUri: existing.bppUri,
        searchIntent: parseJsonField(existing.searchIntent) || null,
        selectedItems: parseJsonField(existing.selectedItems) || null,
        status: existing.status || 'active',
        createdAt: existing.createdAt || now,
        expiresAt: existing.expiresAt || null
    } : {
        transactionId: txnId,
        messageIds: [],
        stage: 'search',
        bppId: null,
        bppUri: null,
        searchIntent: null,
        selectedItems: null,
        status: 'active',
        createdAt: now,
        expiresAt: null
    };

    // Handle $set
    if (update.$set) {
        Object.assign(record, update.$set);
    }

    // Direct fields in update
    if (update.stage) record.stage = update.stage;
    if (update.bppId) record.bppId = update.bppId;
    if (update.bppUri) record.bppUri = update.bppUri;

    // Handle $push for messageIds
    if (update.$push && update.$push.messageIds) {
        record.messageIds.push(update.$push.messageIds);
    }

    // If selectedItems is provided
    if (update.$set && update.$set.selectedItems !== undefined) {
        record.selectedItems = update.$set.selectedItems;
    }

    // Upsert into sqlite
    await db.run(`INSERT OR REPLACE INTO Transactions (transactionId, messageIds, stage, bppId, bppUri, searchIntent, selectedItems, status, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        record.transactionId,
        JSON.stringify(record.messageIds),
        record.stage,
        record.bppId,
        record.bppUri,
        record.searchIntent ? JSON.stringify(record.searchIntent) : null,
        record.selectedItems ? JSON.stringify(record.selectedItems) : null,
        record.status,
        record.createdAt,
        record.expiresAt
    ]);

    return Object.assign({}, record);
};

module.exports.findOne = async (filter) => {
    const txnId = filter.transactionId || filter.transaction_id;
    if (!txnId) return null;
    const row = await db.get('SELECT * FROM Transactions WHERE transactionId = ?', [txnId]);
    if (!row) return null;
    return {
        transactionId: row.transactionId,
        messageIds: row.messageIds ? JSON.parse(row.messageIds) : [],
        stage: row.stage,
        bppId: row.bppId,
        bppUri: row.bppUri,
        searchIntent: row.searchIntent ? JSON.parse(row.searchIntent) : null,
        selectedItems: row.selectedItems ? JSON.parse(row.selectedItems) : null,
        status: row.status,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt
    };
};