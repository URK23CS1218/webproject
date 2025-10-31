const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { 
    expiresIn: '7d' 
  });
};

// Signup controller
exports.signup = async (req, res) => {
  try {
    console.log('📝 Signup attempt:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, role, phone, address, location } = req.body;

    // Basic input validation
    if (!name || !email || !password || !role) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: [
          { msg: 'Name, email, password, and role are required' }
        ]
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // For demo purposes - if password starts with 'demo-', store as is
    let passwordHash;
    if (password.startsWith('demo-')) {
      passwordHash = password;
    } else {
      // Hash regular passwords
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create user with defaults for optional fields
    const user = new User({
      name,
      email,
      passwordHash,
      role,
      phone: phone || '',
      address: address || '',
      location: location || { type: 'Point', coordinates: [0, 0] }
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Return user data (without password)
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    console.log('👤 Login attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user and log result
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    console.log('✅ User found:', { id: user._id, role: user.role });

    // For demo purposes - if password starts with 'demo-', accept it without hashing
    let isPasswordValid = false;
    if (password.startsWith('demo-')) {
      isPasswordValid = true;
    } else {
      // Regular password check with bcrypt
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token using demo format for testing
    const token = `demo-token-${user._id.toString()}-${Date.now()}`;
    console.log('✅ Generated token for user:', { id: user._id, token: token.substring(0, 20) + '...' });

    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        location: user.location
      }
    };

    console.log('✅ Login successful for:', user.email);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Logout controller
exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

// Change password controller
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password and update
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};