const knex = require('knex');

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: process.env.SQLITE_PATH  // from .env — your ondc.db path
    },
    useNullAsDefault: true
});

module.exports = db;
