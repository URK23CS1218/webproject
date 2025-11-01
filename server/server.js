require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Connect to database with better error handling
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jerry_db_user:jerry@cluster0.imaj4pw.mongodb.net/agrolink';
    
    console.log('🔗 Connecting to MongoDB...');
    
    // MongoDB connection options for Render
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ Connected to MongoDB successfully!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Tip: Make sure to whitelist all IPs (0.0.0.0/0) in MongoDB Atlas');
    console.log('🔗 Network Access: https://cloud.mongodb.com → Security → Network Access');
    return false;
  }
};

// Initialize database connection
let dbConnected = false;
connectDB().then(connected => {
  dbConnected = connected;
  if (!connected) {
    console.log('⚠️ Running in demo mode without database');
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://agrolink-frontend.onrender.com',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded product images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database status middleware
app.use((req, res, next) => {
  req.dbConnected = dbConnected;
  next();
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Agro-Link Server is running!',
    database: req.dbConnected ? 'Connected ✅' : 'Demo Mode ⚠️',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Hello from Agro-Link API!",
    database: req.dbConnected ? 'Connected' : 'Demo Mode',
    status: "Server is running successfully",
    timestamp: new Date().toISOString()
  });
});

// Demo data for fallback
const demoProducts = [
  {
    _id: 'demo-product-1',
    title: 'Organic Tomatoes',
    description: 'Fresh organic tomatoes from local farm',
    category: 'Vegetables',
    pricePerUnit: 80,
    measuringUnit: 'kg',
    minOrderQty: 1,
    quantityAvailable: 50,
    shelfLifeDays: 7,
    deliveryRadiusKm: 20,
    farmer: {
      _id: 'demo-farmer-1',
      name: 'Demo Farmer',
      email: 'farmer@demo.com'
    },
    images: []
  },
  {
    _id: 'demo-product-2',
    title: 'Fresh Carrots',
    description: 'Fresh carrots from local farm',
    category: 'Vegetables',
    pricePerUnit: 60,
    measuringUnit: 'kg',
    minOrderQty: 1,
    quantityAvailable: 30,
    shelfLifeDays: 7,
    deliveryRadiusKm: 20,
    farmer: {
      _id: 'demo-farmer-1',
      name: 'Demo Farmer',
      email: 'farmer@demo.com'
    },
    images: []
  },
  {
    _id: 'demo-product-3',
    title: 'Organic Spinach',
    description: 'Fresh organic spinach leaves',
    category: 'Vegetables',
    pricePerUnit: 40,
    measuringUnit: 'kg',
    minOrderQty: 1,
    quantityAvailable: 25,
    shelfLifeDays: 5,
    deliveryRadiusKm: 20,
    farmer: {
      _id: 'demo-farmer-1',
      name: 'Demo Farmer',
      email: 'farmer@demo.com'
    },
    images: []
  }
];

const demoUser = {
  id: 'demo-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'consumer',
  phone: '+1234567890',
  address: '123 Demo Street, Demo City'
};

// AUTH ROUTES with fallback
app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!req.dbConnected) {
      // Fallback for demo mode
      return res.json({
        message: 'Signup successful! (Demo Mode)',
        token: `demo-token-${Date.now()}`,
        user: {
          id: 'new-user-' + Date.now(),
          name: req.body.name || 'New User',
          email: req.body.email || 'new@user.com',
          role: req.body.role || 'consumer',
          phone: req.body.phone || '',
          address: req.body.address || ''
        }
      });
    }

    const { name, email, password, role, phone, address } = req.body;
    console.log('✅ Signup attempt:', { name, email, role });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password,
      role: role || 'consumer',
      phone: phone || '',
      address: address || '',
      location: { type: 'Point', coordinates: [0, 0] }
    });

    await user.save();
    console.log('✅ User saved to MongoDB:', user._id);

    res.json({
      message: 'Signup successful!',
      token: `demo-token-${user._id.toString()}-${Date.now()}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      message: 'Signup error',
      error: error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!req.dbConnected) {
      // Fallback for demo mode
      return res.json({
        message: 'Login successful! (Demo Mode)',
        token: `demo-token-${Date.now()}`,
        user: demoUser
      });
    }

    const { email, password } = req.body;
    console.log('✅ Login attempt:', { email });
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    if (user.passwordHash !== password) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    const response = {
      message: 'Login successful!',
      token: `demo-token-${user._id.toString()}-${Date.now()}`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || ''
      }
    };

    console.log('✅ Login successful, returning:', response);
    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login error',
      error: error.message 
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log('✅ Logout request');
  res.json({ message: 'Logout successful' });
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.dbConnected) {
      // Fallback for demo mode
      return res.json({ user: demoUser });
    }

    console.log('✅ Get current user request');
    const raw = req.header('Authorization') || '';
    const token = raw.replace('Bearer ', '').trim();

    if (token && token.startsWith('demo-token-')) {
      const parts = token.split('-');
      const possibleId = parts[2];
      if (possibleId) {
        const userById = await User.findById(possibleId).select('-passwordHash');
        if (userById) return res.json({ user: userById });
      }
    }

    const user = await User.findOne().select('-passwordHash');
    if (!user) {
      return res.json({ user: demoUser });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// PRODUCT ROUTES with fallback
app.get('/api/products', async (req, res) => {
  try {
    if (!req.dbConnected) {
      // Fallback for demo mode
      return res.json({
        products: demoProducts,
        totalPages: 1,
        currentPage: 1,
        total: demoProducts.length,
        demo: true
      });
    }

    console.log('📦 Fetching all products');
    const products = await Product.find().populate('farmer', 'name email');
    
    res.json({
      products: products.length > 0 ? products : demoProducts,
      totalPages: 1,
      currentPage: 1,
      total: products.length > 0 ? products.length : demoProducts.length
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    if (!req.dbConnected) {
      return res.status(503).json({ 
        message: 'Database unavailable - cannot create product',
        demo: true
      });
    }

    console.log('📦 Creating product:', req.body);
    
    const farmerUser = await User.findOne({ role: 'farmer' });
    const farmerId = farmerUser ? farmerUser._id : '65a1b2c3d4e5f6a7b8c9d0e1';

    const productData = {
      ...req.body,
      farmer: farmerId,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      images: []
    };

    const product = new Product(productData);
    await product.save();

    await product.populate('farmer', 'name email');

    res.status(201).json({
      message: 'Product created successfully!',
      product: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      message: 'Error creating product',
      error: error.message 
    });
  }
});

app.get('/api/products/farmer/my-products', async (req, res) => {
  try {
    if (!req.dbConnected) {
      return res.json([
        {
          _id: 'demo-farmer-product-1',
          title: 'My Organic Tomatoes',
          description: 'Fresh organic tomatoes from my farm',
          category: 'Vegetables',
          pricePerUnit: 80,
          measuringUnit: 'kg',
          minOrderQty: 1,
          quantityAvailable: 50,
          images: []
        }
      ]);
    }

    console.log('👨‍🌾 Fetching farmer products');
    const farmerUser = await User.findOne({ role: 'farmer' });
    const farmerId = farmerUser ? farmerUser._id : '65a1b2c3d4e5f6a7b8c9d0e1';

    const products = await Product.find({ farmer: farmerId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ message: 'Error fetching farmer products' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    if (!req.dbConnected) {
      return res.json({ message: 'Product deleted successfully (Demo Mode)' });
    }

    console.log('🗑️ Deleting product:', req.params.id);
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// ORDER ROUTES with fallback
const orderRoutes = require('./routes/orders.routes');
app.use('/api/orders', (req, res, next) => {
  if (!req.dbConnected) {
    return res.status(503).json({ 
      message: 'Database unavailable - order functionality disabled',
      demo: true
    });
  }
  next();
}, orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'Agro-Link API',
    database: req.dbConnected ? 'Connected' : 'Demo Mode',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Simple weather API
app.get('/api/utils/weather', (req, res) => {
  res.json({
    location: "Demo Location",
    temperature: 25,
    description: "Sunny",
    humidity: 65,
    windSpeed: 12,
    icon: "☀️",
    message: "Weather API is working"
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    database: req.dbConnected ? 'Connected' : 'Demo Mode'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    database: req.dbConnected ? 'Connected' : 'Demo Mode',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`💾 Database: ${dbConnected ? 'CONNECTED ✅' : 'DEMO MODE ⚠️'}`);
  console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
});
