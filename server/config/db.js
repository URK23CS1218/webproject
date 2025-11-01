const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jerry_db_user:jerry@cluster0.imaj4pw.mongodb.net/agrolink';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔗 Connecting to MongoDB...');

    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(MONGODB_URI, options);

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❌ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('💡 IP Whitelist Issue: Add 0.0.0.0/0 to MongoDB Atlas Network Access');
      console.log('🔗 Fix: https://cloud.mongodb.com → Security → Network Access → Add IP Address → 0.0.0.0/0');
    }
    
    // Don't exit process - let the app run in demo mode
    console.log('⚠️ Continuing in demo mode without database connection');
    return false;
  }
};

module.exports = connectDB;
