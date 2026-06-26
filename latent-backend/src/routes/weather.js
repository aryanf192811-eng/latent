const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// Parul University campus coordinates
const CAMPUS_LAT = 22.2855;
const CAMPUS_LON = 73.3648;

// Cache to avoid hammering the API
let weatherCache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// GET /api/weather
router.get('/', auth, async (req, res) => {
  try {
    // Return cached if fresh
    if (weatherCache && Date.now() - cacheTime < CACHE_TTL) {
      return ok(res, weatherCache);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    // If no API key configured, return realistic mock data for Vadodara
    if (!apiKey || apiKey.startsWith('XXXX')) {
      const mockWeather = {
        location: 'Parul University, Waghodia',
        temperature: 32,
        feels_like: 36,
        humidity: 68,
        description: 'Partly cloudy',
        icon: '02d',
        wind_speed: 12,
        visibility: 8000,
        uv_index: 7,
        aqi: 85,
        forecast: [
          { day: 'Today',     high: 34, low: 26, icon: '02d', description: 'Partly cloudy' },
          { day: 'Tomorrow',  high: 33, low: 25, icon: '10d', description: 'Light rain showers' },
          { day: 'Wednesday', high: 31, low: 24, icon: '09d', description: 'Moderate rain' },
          { day: 'Thursday',  high: 30, low: 24, icon: '09d', description: 'Rain' },
          { day: 'Friday',    high: 32, low: 25, icon: '02d', description: 'Partly cloudy' },
        ],
        updated_at: new Date().toISOString(),
        source: 'mock',
      };
      weatherCache = mockWeather;
      cacheTime = Date.now();
      return ok(res, mockWeather);
    }

    // Real OpenWeather call
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${CAMPUS_LAT}&lon=${CAMPUS_LON}&appid=${apiKey}&units=metric`,
      { timeout: 5000 }
    );
    const w = response.data;
    const data = {
      location: 'Parul University, Waghodia',
      temperature: Math.round(w.main.temp),
      feels_like: Math.round(w.main.feels_like),
      humidity: w.main.humidity,
      description: w.weather[0].description,
      icon: w.weather[0].icon,
      wind_speed: Math.round(w.wind.speed * 3.6), // m/s to km/h
      visibility: w.visibility,
      updated_at: new Date().toISOString(),
      source: 'openweather',
    };
    weatherCache = data;
    cacheTime = Date.now();
    ok(res, data);
  } catch (err) {
    // Fallback to mock on error
    const fallback = {
      location: 'Parul University, Waghodia',
      temperature: 31,
      feels_like: 35,
      humidity: 65,
      description: 'Clear sky',
      icon: '01d',
      wind_speed: 10,
      updated_at: new Date().toISOString(),
      source: 'fallback',
    };
    ok(res, fallback);
  }
});

module.exports = router;
