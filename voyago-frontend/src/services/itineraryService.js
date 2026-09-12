import api from './api';

/**
 * Itinerary API Service
 * Encapsulates all backend HTTP calls for Trip Itinerary items.
 */

/**
 * Fetch all itinerary items for a specific trip.
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Array>} List of itinerary items
 */
export const getItinerary = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/itinerary`);
  return response.data;
};

/**
 * Fetch a single itinerary item by ID.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} itemId - Itinerary Item ID
 * @returns {Promise<Object>} Itinerary item details
 */
export const getItineraryItem = async (tripId, itemId) => {
  const response = await api.get(`/trips/${tripId}/itinerary/${itemId}`);
  return response.data;
};

/**
 * Create a new itinerary item for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @param {Object} data - Itinerary item payload (title, description, date, time, location)
 * @returns {Promise<Object>} Created itinerary item object
 */
export const createItineraryItem = async (tripId, data) => {
  const response = await api.post(`/trips/${tripId}/itinerary`, data);
  return response.data;
};

/**
 * Update an existing itinerary item.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} itemId - Itinerary Item ID
 * @param {Object} data - Updated itinerary item payload
 * @returns {Promise<Object>} Updated itinerary item object
 */
export const updateItineraryItem = async (tripId, itemId, data) => {
  const response = await api.put(`/trips/${tripId}/itinerary/${itemId}`, data);
  return response.data;
};

/**
 * Delete an itinerary item.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} itemId - Itinerary Item ID
 * @returns {Promise<Object|void>} Response from delete operation
 */
export const deleteItineraryItem = async (tripId, itemId) => {
  const response = await api.delete(`/trips/${tripId}/itinerary/${itemId}`);
  return response.data;
};

const itineraryService = {
  getItinerary,
  getItineraryItem,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
};

export default itineraryService;
