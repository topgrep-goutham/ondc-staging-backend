const db = require('../config/db');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        await db.connect();
        this.connection = true;
    }

    async disconnect() {
        await db.close();
        this.connection = null;
    }
}

module.exports = new Database();

