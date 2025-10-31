const axios = require('axios');

// Weather API proxy
exports.getWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    if (!lat && !lon && !city) {
      return res.status(400).json({ 
        message: 'Please provide either lat/lon or city name' 
      });
    }

    let weatherUrl;
    
    if (lat && lon) {
      weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${process.env.OPENWEATHER_API_KEY}&q=${lat},${lon}`;
    } else if (city) {
      weatherUrl = `http://api.weatherapi.com/v1/current.json?key=${process.env.OPENWEATHER_API_KEY}&q=${city}`;
    }

    const response = await axios.get(weatherUrl);
    
    // Transform WeatherAPI.com response
    const weatherData = {
      location: response.data.location.name,
      temperature: Math.round(response.data.current.temp_c),
      feelsLike: Math.round(response.data.current.feelslike_c),
      humidity: response.data.current.humidity,
      windSpeed: response.data.current.wind_kph,
      description: response.data.current.condition.text,
      icon: `https:${response.data.current.condition.icon}`,
      main: response.data.current.condition.text
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to fetch weather data' 
    });
  }
};

// AI-based fair price suggestion
exports.getPriceSuggestion = async (req, res) => {
  try {
    const {
      productCategory,
      avgMarketPrice,
      quantityAvailable,
      shelfLifeDays,
      distanceToBuyerKm = 0,
      season = 'normal'
    } = req.body;

    // Simple heuristic pricing
    const supplyFactor = Math.max(0.85, Math.min(1.2, 1 - (quantityAvailable / 200)));
    const distanceFactor = 1 + (distanceToBuyerKm > 50 ? 0.05 : 0);
    const shelfLifeFactor = shelfLifeDays < 3 ? 0.9 : 
                           shelfLifeDays < 7 ? 0.95 : 1.0;
    
    const seasonFactors = { peak: 1.2, normal: 1.0, low: 0.8 };
    const seasonFactor = seasonFactors[season] || 1.0;

    const suggestedPrice = avgMarketPrice * supplyFactor * distanceFactor * shelfLifeFactor * seasonFactor;
    const roundedPrice = Math.round(suggestedPrice * 100) / 100;

    res.json({
      suggestedPrice: roundedPrice,
      factors: {
        supplyFactor: Math.round(supplyFactor * 100) / 100,
        distanceFactor: Math.round(distanceFactor * 100) / 100,
        shelfLifeFactor: Math.round(shelfLifeFactor * 100) / 100,
        seasonFactor: Math.round(seasonFactor * 100) / 100
      }
    });

  } catch (error) {
    console.error('Price suggestion error:', error);
    res.status(500).json({ 
      message: 'Error generating price suggestion' 
    });
  }
};