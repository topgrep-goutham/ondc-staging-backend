const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

let db = null;

module.exports = {
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const dbPath = path.resolve(process.cwd(), config.sqlite?.path || './ondc.bd');
                db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                    if (err) {
                        console.error('SQLite open error:', err.message);
                        return reject(err);
                    }

                    // Create tables if they don't exist
                    const createSearchResult = `CREATE TABLE IF NOT EXISTS SearchResult (
                        transactionId TEXT PRIMARY KEY,
                        catalog TEXT,
                        createdAt TEXT,
                        updatedAt TEXT
                    );`;

                    const createTransaction = `CREATE TABLE IF NOT EXISTS Transactions (
                        transactionId TEXT PRIMARY KEY,
                        messageIds TEXT,
                        stage TEXT,
                        bppId TEXT,
                        bppUri TEXT,
                        searchIntent TEXT,
                        selectedItems TEXT,
                        status TEXT,
                        createdAt TEXT,
                        expiresAt TEXT
                    );`;

                    const createOrder = `CREATE TABLE IF NOT EXISTS Orders (
                        orderId TEXT PRIMARY KEY,
                        transactionId TEXT,
                        bppId TEXT,
                        bppUri TEXT,
                        providerId TEXT,
                        items TEXT,
                        billing TEXT,
                        fulfillment TEXT,
                        payment TEXT,
                        quote TEXT,
                        state TEXT,
                        createdAt TEXT,
                        updatedAt TEXT,
                        callbacks TEXT
                    );`;

                    db.serialize(() => {
                        db.run(createSearchResult);
                        db.run(createTransaction);
                        db.run(createOrder);
                        // Product_Details may already exist in the provided sqlite file; leave it as-is
                    });

                    console.log('✅ SQLite connected at', dbPath);
                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    },

    // Convenience wrappers
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                resolve(this); // return statement info
            });
        });
    },

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    },

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    },

    close() {
        return new Promise((resolve, reject) => {
            if (!db) return resolve();
            db.close((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
};
