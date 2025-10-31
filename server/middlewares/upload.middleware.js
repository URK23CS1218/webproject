const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure upload directory with absolute path
const uploadDir = path.join(__dirname, '../uploads/products');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only jpg, jpeg, png, and gif files are allowed!'), false);
  }
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create multer upload instance
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    files: 5 // Maximum 5 files
  }
}).array('images', 5);

// Export middleware that handles file upload
module.exports = (req, res, next) => {
  console.log('🚀 Starting file upload process');
  
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max size is 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files. Max is 5 images.' });
      }
      return res.status(400).json({ message: err.message });
    } 
    
    if (err) {
      console.error('❌ Upload error:', err);
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.error('❌ No files uploaded');
      return res.status(400).json({ message: 'Please upload at least one image.' });
    }

    console.log('✅ Files uploaded successfully:', req.files.map(f => f.filename));
    next();
  });
};