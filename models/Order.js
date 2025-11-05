const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    transactionId: {
        type: String,
        required: true
    },
    bppId: String,
    bppUri: String,
    providerId: String,
    
    // Order details
    items: [{
        id: String,
        name: String,
        quantity: Number,
        price: Number
    }],
    
    // Customer details
    billing: {
        name: String,
        address: Object,
        phone: String,
        email: String
    },
    
    fulfillment: {
        type: String,
        address: Object,
        contact: Object
    },
    
    // Payment
    payment: {
        type: String,
        status: String,
        amount: Number
    },
    
    // Quote
    quote: {
        price: Number,
        breakup: Array
    },
    
    // Order status
    state: {
        type: String,
        enum: ['Created', 'Accepted', 'In-progress', 'Completed', 'Cancelled'],
        default: 'Created'
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Callbacks received
    callbacks: [{
        action: String,
        timestamp: Date,
        data: Object
    }]
});

// Update timestamp on save
OrderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Order', OrderSchema);