import api from './api';

/**
 * Trip API Service
 * Encapsulates all backend HTTP calls for Trip resources.
 */

/**
 * Create a new trip.
 * @param {Object} data - Trip creation payload (e.g. title, destination, startDate, endDate, budget, etc.)
 * @returns {Promise<Object>} Created trip object
 */
export const createTrip = async (data) => {
  const response = await api.post('/trips', data);
  return response.data;
};

/**
 * Fetch all trips for the authenticated user.
 * @returns {Promise<Array>} List of user's trips
 */
export const getMyTrips = async () => {
  const response = await api.get('/trips');
  return response.data;
};

/**
 * Fetch a single trip by ID.
 * @param {string|number} id - Trip ID
 * @returns {Promise<Object>} Trip details
 */
export const getTrip = async (id) => {
  const response = await api.get(`/trips/${id}`);
  return response.data;
};

/**
 * Update an existing trip.
 * @param {string|number} id - Trip ID
 * @param {Object} data - Trip update payload
 * @returns {Promise<Object>} Updated trip object
 */
export const updateTrip = async (id, data) => {
  const response = await api.put(`/trips/${id}`, data);
  return response.data;
};

/**
 * Delete a trip by ID.
 * @param {string|number} id - Trip ID
 * @returns {Promise<Object|void>} Response from delete operation
 */
export const deleteTrip = async (id) => {
  const response = await api.delete(`/trips/${id}`);
  return response.data;
};

const tripService = {
  createTrip,
  getMyTrips,
  getTrip,
  updateTrip,
  deleteTrip,
};

export default tripService;
