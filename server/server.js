require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to database with error handling
(async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
})();

// Middleware

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Log directory creation
console.log('📁 Uploads directory:', {
  path: uploadsDir,
  exists: fs.existsSync(uploadsDir),
  writable: fs.accessSync(uploadsDir, fs.constants.W_OK) || true
});

// Serve uploaded product images statically with caching disabled for development
app.use('/uploads', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  etag: false
}));
console.log('📡 Serving static files from:', path.join(__dirname, 'uploads'));

// Log static file requests in development
app.use('/uploads', (req, res, next) => {
  console.log('📸 Image request:', req.url);
  next();
});

// Test route
app.get('/', (req, res) => {
  res.send('🚀 Agro-Link Server is running! (Express + MongoDB + CORS)');
});

// Test API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Hello from Agro-Link Express + MongoDB + CORS!",
    status: "Server is running successfully",
    timestamp: new Date().toISOString()
  });
});

// MODELS
const User = require('./models/User.model');
const Product = require('./models/Product.model');

// Import routes
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');
const debugRoutes = require('./routes/debug.routes');

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
// Debug routes - only in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
}

// AUTH ROUTES - Direct implementation for simplicity
app.post('/api/auth/signup', async (req, res) => {
  try {
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
      passwordHash: password, // For demo, using plain password
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
    const { email, password } = req.body;
    console.log('✅ Login attempt:', { email });
    
    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Simple password check (direct comparison for demo)
    if (user.passwordHash !== password) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Return success with demo token
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

    // Fallback: return the first user from database (demo)
    const user = await User.findOne().select('-passwordHash');
    if (!user) {
      return res.json({
        user: {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'consumer'
        }
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// AUTH ROUTES - UPDATED TO SAVE TO MONGODB
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    console.log('✅ Signup attempt:', { name, email, role });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create new user (for demo, we'll use plain password)
    // In production, you should hash the password with bcrypt
    const user = new User({
      name,
      email,
      passwordHash: password, // In real app, hash this with bcrypt
      role: role || 'consumer',
      phone: phone || '',
      address: address || '',
      location: { type: 'Point', coordinates: [0, 0] }
    });

    await user.save();
    console.log('✅ User saved to MongoDB:', user._id);

    res.json({
      message: 'Signup successful!',
      // Include the user id in the demo token so the auth middleware can restore the user
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

// UPDATED LOGIN ROUTE - FIXED
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('✅ Login attempt:', { email });
    
    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Simple password check (in real app, use bcrypt.compare)
    if (user.passwordHash !== password) {
      return res.status(400).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Return the exact format that frontend expects
    // Include user id in demo token so middleware can restore user
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
    console.log('✅ Get current user request');
    // Try to detect demo token and return that user if possible
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

    // Fallback: return the first user from database (demo)
    const user = await User.findOne().select('-passwordHash');
    if (!user) {
      return res.json({
        user: {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'consumer'
        }
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// PRODUCT ROUTES
// Get all products (for consumers)
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Fetching all products');
    
    const products = await Product.find().populate('farmer', 'name email');
    
    res.json({
      products: products.length > 0 ? products : [
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
        }
      ],
      totalPages: 1,
      currentPage: 1,
      total: products.length > 0 ? products.length : 1
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Create product (for farmers)
app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 Creating product:', req.body);
    
    // Get a farmer user from database to associate with the product
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

    // Populate farmer details
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

// Get farmer's products
app.get('/api/products/farmer/my-products', async (req, res) => {
  try {
    console.log('👨‍🌾 Fetching farmer products');
    
    // Get farmer ID from database or use demo ID
    const farmerUser = await User.findOne({ role: 'farmer' });
    const farmerId = farmerUser ? farmerUser._id : '65a1b2c3d4e5f6a7b8c9d0e1';

    const products = await Product.find({ farmer: farmerId })
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ message: 'Error fetching farmer products' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting product:', req.params.id);
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'Agro-Link API',
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
    message: "Weather API is working (demo mode)"
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET  /',
      'GET  /api/test',
      'GET  /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET  /api/auth/me',
      'GET  /api/products',
      'POST /api/products',
      'GET  /api/products/farmer/my-products',
      'DELETE /api/products/:id',
      'GET  /api/utils/weather'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`🔐 Available endpoints:`);
  console.log(`   AUTH: POST /api/auth/signup, /api/auth/login, /api/auth/logout`);
  console.log(`   PRODUCTS: GET /api/products, POST /api/products, GET /api/products/farmer/my-products`);
  console.log(`   UTILS: GET /api/utils/weather`);
});