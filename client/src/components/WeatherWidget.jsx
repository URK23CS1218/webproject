import React, { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import api from '../services/api';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      // Try to get location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await api.get(
                `/api/utils/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
              );
              setWeather(response.data);
            } catch (err) {
              setError('Failed to fetch weather data');
            } finally {
              setLoading(false);
            }
          },
          async () => {
            // Fallback to city-based weather
            try {
              const response = await api.get('/api/utils/weather?city=Mumbai');
              setWeather(response.data);
            } catch (err) {
              setError('Failed to fetch weather data');
            } finally {
              setLoading(false);
            }
          }
        );
      }
    } catch (error) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" />
          <span className="ms-2">Loading weather...</span>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center text-muted">
          {error}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Weather</h5>
      </Card.Header>
      <Card.Body>
        {weather && (
          <div className="text-center">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <img 
                src={getWeatherIcon(weather.icon)} 
                alt={weather.description}
                style={{ width: '60px', height: '60px' }}
              />
              <div className="ms-3">
                <h3 className="mb-0">{weather.temperature}°C</h3>
                <small className="text-muted">{weather.location}</small>
              </div>
            </div>
            
            <div className="row text-center">
              <div className="col-4">
                <small className="text-muted">Feels like</small>
                <div>{weather.feelsLike}°C</div>
              </div>
              <div className="col-4">
                <small className="text-muted">Humidity</small>
                <div>{weather.humidity}%</div>
              </div>
              <div className="col-4">
                <small className="text-muted">Wind</small>
                <div>{weather.windSpeed} m/s</div>
              </div>
            </div>
            
            <div className="mt-2">
              <small className="text-capitalize">{weather.description}</small>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default WeatherWidget;