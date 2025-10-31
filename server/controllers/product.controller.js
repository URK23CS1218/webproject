const Product = require('../models/Product.model');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    let query = {};
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('farmer', 'name email phone address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name email phone address');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    console.log('⭐ Creating product');
    console.log('📝 Request body:', req.body);
    console.log('🖼️ Request files:', req.files);
    
    // Check for required fields
    const requiredFields = ['title', 'description', 'category', 'pricePerUnit', 
                          'measuringUnit', 'minOrderQty', 'shelfLifeDays', 
                          'quantityAvailable', 'deliveryRadiusKm'];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        console.error(`❌ Missing required field: ${field}`);
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate and parse numeric fields
    const numericFields = {
      pricePerUnit: parseFloat(req.body.pricePerUnit),
      minOrderQty: parseInt(req.body.minOrderQty),
      shelfLifeDays: parseInt(req.body.shelfLifeDays),
      quantityAvailable: parseInt(req.body.quantityAvailable),
      deliveryRadiusKm: parseInt(req.body.deliveryRadiusKm)
    };

    // Validate numeric fields
    for (const [key, value] of Object.entries(numericFields)) {
      if (isNaN(value)) {
        return res.status(400).json({ message: `Invalid ${key} value` });
      }
    }

    // Process and validate images
    const images = req.files.map(file => {
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`;
      console.log('Processing file:', { filename: file.filename, url: imageUrl });
      return imageUrl;
    });

    const productData = {
      ...req.body,
      ...numericFields,
      farmer: req.user.id,
      images: images
    };

    console.log('Final product data:', productData);

    const product = new Product(productData);
    await product.save();

    await product.populate('farmer', 'name email phone address');

    console.log('Product saved successfully:', product);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns the product
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Parse existingImages from JSON string if it exists
    let existingImages = [];
    try {
      existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    } catch (error) {
      console.error('Error parsing existingImages:', error);
      existingImages = [];
    }

    // Handle uploaded files
    let images = existingImages;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      images = [...images, ...newImages];
    }

    // Convert numeric fields
    const numericFields = {
      pricePerUnit: parseFloat(req.body.pricePerUnit),
      minOrderQty: parseInt(req.body.minOrderQty),
      shelfLifeDays: parseInt(req.body.shelfLifeDays),
      quantityAvailable: parseInt(req.body.quantityAvailable),
      deliveryRadiusKm: parseInt(req.body.deliveryRadiusKm)
    };

    // Validate numeric fields
    for (const [key, value] of Object.entries(numericFields)) {
      if (isNaN(value)) {
        return res.status(400).json({ message: `Invalid ${key} value` });
      }
    }

    // Update product data
    const updatedData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      measuringUnit: req.body.measuringUnit,
      ...numericFields,
      images: images
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('farmer', 'name email phone address');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

// Get farmer's products
exports.getFarmerProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user.id })
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};