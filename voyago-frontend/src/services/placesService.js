import api from './api';

/**
 * Places API Service
 * Encapsulates backend HTTP calls for tourist places and attractions.
 */

/**
 * Fetch tourist attractions and notable places for a destination.
 * @param {string} destination - Destination or city name
 * @returns {Promise<Object>} PlacesResponse containing location and places list (up to 15 items)
 */
export const getPlaces = async (destination) => {
  if (!destination || !destination.trim()) {
    throw new Error('Destination is required');
  }

  const response = await api.get('/places', {
    params: { destination: destination.trim() },
  });
  return response.data;
};

const placesService = {
  getPlaces,
};

export default placesService;
