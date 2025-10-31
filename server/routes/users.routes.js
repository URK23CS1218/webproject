const express = require('express');
const { body } = require('express-validator');
const {
  getUserProfile,
  updateUserProfile
} = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\d{10,}$/).withMessage('Phone must be at least 10 digits')
    .isLength({ max: 15 }).withMessage('Phone number cannot exceed 15 digits'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('Address must be at least 5 characters')
    .isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters')
];

// Routes
router.get('/:id', authMiddleware, getUserProfile);
router.put('/:id', authMiddleware, updateProfileValidation, updateUserProfile);

module.exports = router;