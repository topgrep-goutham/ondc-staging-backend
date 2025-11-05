const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    
    messageIds: [{
        messageId: String,
        action: String,
        timestamp: Date
    }],
    
    stage: {
        type: String,
        enum: ['search', 'select', 'init', 'confirm', 'post-order'],
        default: 'search'
    },
    
    bppId: String,
    bppUri: String,
    
    searchIntent: Object,
    selectedItems: Array,
    
    status: {
        type: String,
        enum: ['active', 'completed', 'failed', 'expired'],
        default: 'active'
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);