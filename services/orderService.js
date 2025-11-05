const Order = require('../models/Order');

class OrderService {
    // Create new order
    async createOrder(orderData) {
        try {
            const order = new Order(orderData);
            await order.save();
            return order;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    // Get order by ID
    async getOrder(orderId) {
        try {
            return await Order.findOne({ orderId });
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    }

    // Update order
    async updateOrder(orderId, updateData) {
        try {
            return await Order.findOneAndUpdate(
                { orderId },
                { $set: updateData },
                { new: true }
            );
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }
    }

    // Add callback to order
    async addCallback(orderId, action, data) {
        try {
            return await Order.findOneAndUpdate(
                { orderId },
                {
                    $push: {
                        callbacks: {
                            action,
                            timestamp: new Date(),
                            data
                        }
                    }
                },
                { new: true }
            );
        } catch (error) {
            console.error('Error adding callback:', error);
            throw error;
        }
    }

    // Get all orders for a user
    async getUserOrders(userId) {
        try {
            return await Order.find({ 'billing.userId': userId })
                .sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error fetching user orders:', error);
            throw error;
        }
    }

    // Cancel order
    async cancelOrder(orderId, reason) {
        try {
            return await Order.findOneAndUpdate(
                { orderId },
                {
                    $set: {
                        state: 'Cancelled',
                        cancellationReason: reason,
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    }
}

module.exports = new OrderService();