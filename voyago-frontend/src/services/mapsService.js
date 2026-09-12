import api from './api';

/**
 * Maps & Routes API Service
 * Encapsulates backend HTTP calls for maps geocoding, places coordinates, and route calculations.
 */

/**
 * Fetch geographic coordinates for a destination.
 * @param {string} destination - Destination or city name
 * @returns {Promise<Object>} MapResponse containing { location: { name, country, latitude, longitude } }
 */
export const getMapLocation = async (destination) => {
  if (!destination || !destination.trim()) {
    throw new Error('Destination is required');
  }

  const response = await api.get('/maps', {
    params: { destination: destination.trim() },
  });
  return response.data;
};

/**
 * Fetch tourist places and attractions with coordinates for map visualization.
 * @param {string} destination - Destination or city name
 * @returns {Promise<Object>} PlacesResponse containing location and places list (up to 15 items)
 */
export const getMapPlaces = async (destination) => {
  if (!destination || !destination.trim()) {
    throw new Error('Destination is required');
  }

  const response = await api.get('/maps/places', {
    params: { destination: destination.trim() },
  });
  return response.data;
};

/**
 * Calculate driving route between two coordinate points.
 * @param {number} startLat - Starting point latitude
 * @param {number} startLng - Starting point longitude
 * @param {number} endLat - Ending point latitude
 * @param {number} endLng - Ending point longitude
 * @returns {Promise<Object>} RouteResponse containing start, end, distanceKm, durationMinutes, geometry
 */
export const getRoute = async (startLat, startLng, endLat, endLng) => {
  if (startLat == null || startLng == null || endLat == null || endLng == null) {
    throw new Error('All coordinates (startLat, startLng, endLat, endLng) are required');
  }

  const response = await api.get('/maps/route', {
    params: {
      startLat,
      startLng,
      endLat,
      endLng,
    },
  });
  return response.data;
};

const mapsService = {
  getMapLocation,
  getMapPlaces,
  getRoute,
};

export default mapsService;
