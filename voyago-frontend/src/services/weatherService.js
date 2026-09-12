import api from './api';

/**
 * Weather API Service
 * Encapsulates backend HTTP calls for destination weather and forecast.
 */

/**
 * Fetch real-time weather and 7-day forecast for a destination.
 * @param {string} destination - Destination or city name
 * @returns {Promise<Object>} WeatherResponse containing location, current, and forecast
 */
export const getWeather = async (destination) => {
  if (!destination || !destination.trim()) {
    throw new Error('Destination is required');
  }

  const response = await api.get('/weather', {
    params: { destination: destination.trim() },
  });
  return response.data;
};

const weatherService = {
  getWeather,
};

export default weatherService;
