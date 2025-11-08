const db = require('../config/db');

module.exports.findOne = async (filter) => {
    const txnId = filter.transactionId || filter.transaction_id;
    if (!txnId) return null;
    const row = await db.get('SELECT * FROM SearchResult WHERE transactionId = ?', [txnId]);
    if (!row) return null;
    return {
        transactionId: row.transactionId,
        catalog: row.catalog ? JSON.parse(row.catalog) : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
};

module.exports.findOneAndUpdate = async (filter, update, options = {}) => {
    const txnId = filter.transactionId || filter.transaction_id;
    if (!txnId) throw new Error('transactionId is required');

    const existing = await db.get('SELECT * FROM SearchResult WHERE transactionId = ?', [txnId]);
    const now = new Date().toISOString();
    const catalog = update.catalog || (update.$set && update.$set.catalog) || (existing && existing.catalog ? JSON.parse(existing.catalog) : null);

    const createdAt = existing ? existing.createdAt : (update.createdAt || now);
    const updatedAt = update.updatedAt || now;

    const catalogJson = catalog ? JSON.stringify(catalog) : null;

    // Use INSERT OR REPLACE to upsert
    await db.run(
        `INSERT OR REPLACE INTO SearchResult (transactionId, catalog, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
        [txnId, catalogJson, createdAt, updatedAt]
    );

    return module.exports.findOne({ transactionId: txnId });
};
