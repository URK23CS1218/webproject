const express = require('express');
const { getWeather, getPriceSuggestion } = require('../controllers/utils.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/weather', getWeather);
router.post('/price-suggest', authMiddleware, getPriceSuggestion);

module.exports = router;