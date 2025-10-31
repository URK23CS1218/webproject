const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFarmerProducts
} = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Farmer routes with authentication
router.get('/farmer/my-products', authMiddleware, roleMiddleware(['farmer']), getFarmerProducts);
router.post('/', 
  (req, res, next) => {
    console.log('⭐ Starting product creation request');
    next();
  },
  authMiddleware, 
  roleMiddleware(['farmer']),
  (req, res, next) => {
    console.log('✅ Auth and role check passed');
    next();
  },
  upload,
  (req, res, next) => {
    console.log('📸 File upload processed:', { files: req.files });
    next();
  },
  createProduct
);
router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['farmer']),
  upload, // Using our custom middleware
  updateProduct
);
router.delete('/:id', authMiddleware, roleMiddleware(['farmer']), deleteProduct);

module.exports = router;