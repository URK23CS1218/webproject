const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getConsumerOrders,
  getFarmerOrders,
  updateOrderStatus,
  getOrder
} = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// Validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').trim().isLength({ min: 10 }).withMessage('Delivery address must be at least 10 characters')
];

// Create new order
router.post('/', authMiddleware, roleMiddleware(['consumer']), orderValidation, createOrder);

// Get orders by role
router.get('/consumer', authMiddleware, roleMiddleware(['consumer']), getConsumerOrders);
router.get('/farmer', authMiddleware, roleMiddleware(['farmer']), getFarmerOrders);

// Get specific order
router.get('/:id', authMiddleware, getOrder);

// Update order status
router.put('/:id/status', authMiddleware, roleMiddleware(['farmer']), updateOrderStatus);

module.exports = router;