const db = require('../config/db');

/**
 * Store search results into Product_Details table.
 * Accepts ONDC context and message (on_search callback body parts).
 * The function is robust to different column naming conventions: it queries
 * the table columns and only inserts the columns that exist.
 *
 * @param {object} context - ONDC context object (contains transaction_id)
 * @param {object} message - ONDC message object (should contain catalog)
 */
module.exports.storeSearchResults = async (context, message) => {
    if (!context) throw new Error('context is required');

    const transactionId = context.transaction_id || context.transactionId;
    if (!transactionId) throw new Error('transaction_id is required in context');

    const catalog = message?.catalog || message;

    // Attempt to find providers and items in common shapes
    let providers = [];
    if (catalog && catalog['bpp/providers']) {
        providers = catalog['bpp/providers'];
    } else if (catalog && catalog.providers) {
        providers = catalog.providers;
    } else if (Array.isArray(catalog)) {
        providers = catalog;
    }

    if (!providers || !providers.length) {
        // nothing to store
        return { inserted: 0 };
    }

    // Get existing Product_Details table columns
    const cols = await db.all("PRAGMA table_info('Product_Details')");
    const columnNames = new Set((cols || []).map(c => c.name));

    // Helper to add a key if table has that column
    const buildRow = (base) => {
        const row = {};
        for (const key of Object.keys(base)) {
            if (columnNames.has(key)) row[key] = base[key];
        }
        return row;
    };

    const { v4: uuid } = require('uuid');
    let inserted = 0;

    for (const provider of providers) {
        const providerId = provider.id || provider['provider_id'] || null;
        const providerDescriptor = provider.descriptor || {};
        const providerName = providerDescriptor.name || providerDescriptor.short_desc || null;

        const items = Array.isArray(provider.items) ? provider.items : (provider['items'] || []);

        for (const item of items) {
            // Map common fields
            const descriptor = item.descriptor || {};
            const price = item.price || item.price || {};

            const base = {
                id: uuid(),  // Generate UUID for primary key
                transaction_id: transactionId,
                provider_id: providerId,
                provider_name: providerName,
                item_id: item.id || item.item_id || null,
                item_name: descriptor.name || descriptor.short_desc || null,
                item_code: item.code || null,
                price_value: price.value != null ? String(price.value) : null,
                currency: price.currency || item.currency || null,
                image_url: descriptor.images && descriptor.images.length ? descriptor.images[0] : null,
                category_id: item.category_id || item.category || null,
                fulfillment_id: (item.fulfillment_id || (item.fulfillment && item.fulfillment.id) || null),
                location_id: item.location_id || null,
                quantity_available: (item.quantity && (item.quantity.count || item.quantity)) || null,
                ondc_timestamp: new Date().toISOString(),
                raw_json: JSON.stringify(item)
            };

            const insertData = buildRow(base);

            // Skip if minimal columns aren't present
            if (!insertData || !insertData.transaction_id || !insertData.id || !insertData.item_id) continue;

            const columns = Object.keys(insertData);
            const placeholders = columns.map(() => '?').join(', ');
            const sql = `INSERT INTO Product_Details (${columns.join(', ')}) VALUES (${placeholders})`;
            const params = columns.map(c => insertData[c]);

            try {
                await db.run(sql, params);
                inserted++;
            } catch (err) {
                // Log and continue; don't fail whole operation for one bad row
                console.error('Failed to insert product detail row:', err.message || err, { transactionId, providerId, itemId: base.item_id });
            }
        }
    }

    return { inserted };
};

module.exports.storeSearchResults = module.exports.storeSearchResults;
