const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Rice', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Other']
  },
  images: [{
    type: String
  }],
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price cannot be negative']
  },
  measuringUnit: {
    type: String,
    required: [true, 'Measuring unit is required'],
    enum: ['kg', 'g', 'packet', 'bunch', 'piece', 'litre']
  },
  minOrderQty: {
    type: Number,
    required: [true, 'Minimum order quantity is required'],
    min: [1, 'Minimum order quantity must be at least 1']
  },
  shelfLifeDays: {
    type: Number,
    required: [true, 'Shelf life is required'],
    min: [1, 'Shelf life must be at least 1 day']
  },
  quantityAvailable: {
    type: Number,
    required: [true, 'Quantity available is required'],
    min: [0, 'Quantity cannot be negative']
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  deliveryRadiusKm: {
    type: Number,
    required: [true, 'Delivery radius is required'],
    min: [0, 'Delivery radius cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);