// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// const config = require('./config');

// let db = null;

// module.exports = {
//     async connect() {
//         return new Promise((resolve, reject) => {
//             try {
//                 const dbPath = path.resolve(process.cwd(), config.sqlite?.path || './ondc.bd');
//                 db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
//                     if (err) {
//                         console.error('SQLite open error:', err.message);
//                         return reject(err);
//                     }

//                     // Create tables if they don't exist
//                     const createSearchResult = `CREATE TABLE IF NOT EXISTS SearchResult (
//                         transactionId TEXT PRIMARY KEY,
//                         catalog TEXT,
//                         createdAt TEXT,
//                         updatedAt TEXT
//                     );`;

//                     const createTransaction = `CREATE TABLE IF NOT EXISTS Transactions (
//                         transactionId TEXT PRIMARY KEY,
//                         messageIds TEXT,
//                         stage TEXT,
//                         bppId TEXT,
//                         bppUri TEXT,
//                         searchIntent TEXT,
//                         selectedItems TEXT,
//                         status TEXT,
//                         createdAt TEXT,
//                         expiresAt TEXT
//                     );`;

//                     const createOrder = `CREATE TABLE IF NOT EXISTS Orders (
//                         orderId TEXT PRIMARY KEY,
//                         transactionId TEXT,
//                         bppId TEXT,
//                         bppUri TEXT,
//                         providerId TEXT,
//                         items TEXT,
//                         billing TEXT,
//                         fulfillment TEXT,
//                         payment TEXT,
//                         quote TEXT,
//                         state TEXT,
//                         createdAt TEXT,
//                         updatedAt TEXT,
//                         callbacks TEXT
//                     );`;

//                     db.serialize(() => {
//                         db.run(createSearchResult);
//                         db.run(createTransaction);
//                         db.run(createOrder);
//                         // Product_Details may already exist in the provided sqlite file; leave it as-is
//                     });

//                     console.log('✅ SQLite connected at', dbPath);
//                     resolve();
//                 });
//             } catch (err) {
//                 reject(err);
//             }
//         });
//     },

//     // Convenience wrappers
//     run(sql, params = []) {
//         return new Promise((resolve, reject) => {
//             db.run(sql, params, function (err) {
//                 if (err) return reject(err);
//                 resolve(this); // return statement info
//             });
//         });
//     },

//     get(sql, params = []) {
//         return new Promise((resolve, reject) => {
//             db.get(sql, params, (err, row) => {
//                 if (err) return reject(err);
//                 resolve(row);
//             });
//         });
//     },

//     all(sql, params = []) {
//         return new Promise((resolve, reject) => {
//             db.all(sql, params, (err, rows) => {
//                 if (err) return reject(err);
//                 resolve(rows);
//             });
//         });
//     },

//     close() {
//         return new Promise((resolve, reject) => {
//             if (!db) return resolve();
//             db.close((err) => {
//                 if (err) return reject(err);
//                 resolve();
//             });
//         });
//     }
// };



const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this._connecting = null;
    }

    async connect() {
        if (this.db) return Promise.resolve();

        if (this._connecting) return this._connecting;

        this._connecting = new Promise((resolve, reject) => {
            const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../ondc.db');

            console.log('Connecting to SQLite DB at', dbPath);

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection error:', err);
                    this._connecting = null;
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database at', dbPath);
                    this.initializeTables()
                        .then(() => {
                            this._connecting = null;
                            resolve();
                        })
                        .catch(err => {
                            this._connecting = null;
                            reject(err);
                        });
                }
            });
        });

        return this._connecting;
    }

    async initializeTables() {
        const createTransactionsTable = `
            CREATE TABLE IF NOT EXISTS Transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transactionId TEXT UNIQUE NOT NULL,
                messageId TEXT,
                action TEXT,
                bppId TEXT,
                bppUri TEXT,
                domain TEXT,
                city TEXT,
                country TEXT,
                timestamp TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createProductDetailsTable = `
            CREATE TABLE IF NOT EXISTS Product_Details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transactionId TEXT NOT NULL,
                providerId TEXT,
                providerName TEXT,
                providerShortDesc TEXT,
                providerLongDesc TEXT,
                providerImages TEXT,
                itemId TEXT,
                itemName TEXT,
                itemDescription TEXT,
                itemPrice TEXT,
                itemCurrency TEXT,
                itemImages TEXT,
                categoryId TEXT,
                fulfillmentId TEXT,
                locationId TEXT,
                quantity TEXT,
                available BOOLEAN,
                tags TEXT,
                rawData TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transactionId) REFERENCES Transactions(transactionId)
            )
        `;

        const createSearchResultTable = `
            CREATE TABLE IF NOT EXISTS SearchResult (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transactionId TEXT NOT NULL,
                messageId TEXT,
                bppId TEXT,
                bppUri TEXT,
                bppDescriptorName TEXT,
                bppDescriptorSymbol TEXT,
                bppDescriptorShortDesc TEXT,
                bppDescriptorLongDesc TEXT,
                bppDescriptorImages TEXT,
                rawContext TEXT,
                rawMessage TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transactionId) REFERENCES Transactions(transactionId)
            )
        `;

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(createTransactionsTable, (err) => {
                    if (err) {
                        console.error('Error creating Transactions table:', err);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createProductDetailsTable, (err) => {
                    if (err) {
                        console.error('Error creating Product_Details table:', err);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createSearchResultTable, (err) => {
                    if (err) {
                        console.error('Error creating SearchResult table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Database tables initialized');
                    resolve();
                });
            });
        });
    }

    run(sql, params = []) {
        return (async () => {
            await this.ensureConnected();
            return new Promise((resolve, reject) => {
                this.db.run(sql, params, function (err) {
                    if (err) {
                        console.error('Database run error:', err);
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, changes: this.changes });
                    }
                });
            });
        })();
    }

    get(sql, params = []) {
        return (async () => {
            await this.ensureConnected();
            return new Promise((resolve, reject) => {
                this.db.get(sql, params, (err, row) => {
                    if (err) {
                        console.error('Database get error:', err);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        })();
    }

    all(sql, params = []) {
        console.log("sql", sql)
        console.log("sqparamsl", params)
        return (async () => {
            const ensure = await this.ensureConnected();
            console.log(ensure)
            return new Promise((resolve, reject) => {
                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error('Database all error:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        })();
    }

    async ensureConnected() {
        if (this.db) return;
        // if a connection attempt is in progress, await it; otherwise start one
        if (this._connecting) return this._connecting;
        return this.connect();
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('✅ Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new Database();