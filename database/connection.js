const mongoose = require('mongoose');
const config = require('../config/config');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            const dbUrl = `mongodb://${config.database.host}:${config.database.port}/${config.database.name}`;

            this.connection = await mongoose.connect(dbUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });


            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error('Database connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('Database disconnected');
            });

        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.disconnect();
            console.log('Database disconnected');
        }
    }
}

module.exports = new Database();

