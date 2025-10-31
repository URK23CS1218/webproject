const User = require('../models/User.model');
const { validationResult } = require('express-validator');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is accessing their own profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    console.log('📝 Profile update request:', {
      userId: req.params.id,
      updatedBy: req.user.id,
      fields: Object.keys(req.body)
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, phone, address } = req.body;
    
    // Check if user is updating their own profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      console.log('❌ Unauthorized profile update attempt:', {
        targetUserId: req.params.id,
        requestingUserId: req.user.id,
        userRole: req.user.role
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate input data
    if (name && name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    
    if (phone && !phone.match(/^\d{10,}$/)) {
      return res.status(400).json({ message: 'Phone number must be at least 10 digits' });
    }

    // Only update fields that were provided
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();

    console.log('🔄 Updating profile with data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        select: '-passwordHash',
        context: 'query'
      }
    );

    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Profile updated successfully:', {
      userId: user._id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('❌ Profile update error:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid data provided',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: 'Server error updating profile',
      error: error.message
    });
  }
};