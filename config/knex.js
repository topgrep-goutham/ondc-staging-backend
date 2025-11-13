const knex = require('knex');
const path = require('path');

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: '/tmp/ondc.db'  
    },
    useNullAsDefault: true
});

// Initialize tables
async function initializeTables() {
    try {
        // Create on_search_results table if it doesn't exist
        const hasTable = await db.schema.hasTable('on_search_results');
        console.log(hasTable)

        if (!hasTable) {
            await db.schema.createTable('on_search_results', (table) => {
                table.increments('id').primary();
                table.string('transaction_id').notNullable().unique();
                table.string('message_id');
                table.text('context').notNullable(); // JSON stored as text
                table.text('message').notNullable(); // JSON stored as text
                table.timestamp('created_at').defaultTo(db.fn.now());
            });
            console.log('✅ Table on_search_results created');
        }
    } catch (error) {
        console.error('❌ Error initializing tables:', error);
        throw error;
    }
}

// Call initialization
initializeTables().catch(console.error);

module.exports = db;