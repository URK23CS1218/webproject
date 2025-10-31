const express = require('express');
const router = express.Router();
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const mongoose = require('mongoose');

// Debug endpoint to test order creation
router.post('/test-order', async (req, res) => {
    let session;
    try {
        session = await mongoose.startSession();
        await session.startTransaction();
        
        console.log('🔄 Debug: Testing order creation...');
        
        // Find a product to use
        const product = await Product.findOne().session(session);
        if (!product) {
            throw new Error('No products found in database');
        }

        // Find a consumer user
        const User = require('../models/User.model');
        const consumer = await User.findOne({ role: 'consumer' }).session(session);
        if (!consumer) {
            throw new Error('No consumer found in database');
        }

        // Create test order
        const order = new Order({
            consumer: consumer._id,
            farmer: product.farmer,
            items: [{
                product: product._id,
                title: product.title,
                qty: 1,
                unitPrice: product.pricePerUnit,
                measuringUnit: product.measuringUnit
            }],
            subtotal: product.pricePerUnit,
            deliveryAddress: consumer.address || 'Test Address',
            status: 'placed'
        });

        const savedOrder = await order.save({ session });
        console.log('✅ Test order saved:', savedOrder._id);

        // Populate order details
        const populatedOrder = await Order.findById(savedOrder._id)
            .populate('consumer', 'name email phone')
            .populate('farmer', 'name email phone')
            .populate('items.product', 'title images pricePerUnit measuringUnit')
            .session(session);

        await session.commitTransaction();
        
        res.json({
            message: 'Test order created successfully',
            order: populatedOrder,
            debug: {
                consumerId: consumer._id,
                farmerId: product.farmer,
                productId: product._id
            }
        });
    } catch (error) {
        if (session) await session.abortTransaction();
        console.error('🔥 Debug order creation error:', error);
        res.status(500).json({
            message: 'Error creating test order',
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    } finally {
        if (session) await session.endSession();
    }
});

// Get MongoDB connection status
router.get('/db-status', async (req, res) => {
    try {
        const status = mongoose.connection.readyState;
        const statusMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        res.json({
            status: statusMap[status] || 'unknown',
            database: mongoose.connection.name,
            host: mongoose.connection.host,
            connected: status === 1
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error checking database status',
            error: error.message
        });
    }
});

module.exports = router;