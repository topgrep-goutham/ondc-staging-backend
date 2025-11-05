const mongoose = require('mongoose');
const config = require('./config');

module.exports = {
    async connect() {
        try {
            await mongoose.connect(`mongodb://${config.database.host}:${config.database.port}/${config.database.name}`);
            console.log('✅ MongoDB connected');
        } catch (err) {
            console.error('MongoDB error:', err.message);
        }
    }
};
