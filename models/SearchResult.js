const mongoose = require('mongoose');

const searchResultSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    catalog: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SearchResult', searchResultSchema);
