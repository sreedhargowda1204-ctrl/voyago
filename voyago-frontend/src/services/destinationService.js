import api from './api';

/**
 * Destination API Service
 * Encapsulates backend HTTP calls for Karnataka Destination Catalog and Autocomplete.
 */

/**
 * Search destinations with autocomplete query.
 * @param {string} query - Destination search query
 * @param {number} [limit=8] - Max results to return
 * @returns {Promise<Object>} DestinationSearchResponse containing query, count, and destinations list
 */
export const searchDestinations = async (query, limit = 8) => {
  if (!query || !query.trim()) {
    return { query: '', count: 0, destinations: [] };
  }

  const response = await api.get('/destinations/search', {
    params: { query: query.trim(), limit },
  });
  return response.data;
};

/**
 * Fetch all Karnataka destinations, optionally filtered by district or category.
 * @param {Object} [filters={}] - Optional filters (district, category)
 * @returns {Promise<Array>} List of DestinationDto objects
 */
export const getKarnatakaDestinations = async (filters = {}) => {
  const response = await api.get('/destinations/karnataka', {
    params: filters,
  });
  return response.data;
};

/**
 * Fetch single destination details by ID.
 * @param {number|string} id - Destination ID
 * @returns {Promise<Object>} DestinationDto
 */
export const getDestinationById = async (id) => {
  const response = await api.get(`/destinations/${id}`);
  return response.data;
};

const destinationService = {
  searchDestinations,
  getKarnatakaDestinations,
  getDestinationById,
};

export default destinationService;
