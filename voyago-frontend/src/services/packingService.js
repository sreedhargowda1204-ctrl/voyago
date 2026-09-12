import api from './api';

/**
 * Trip Packing List API Service
 * Encapsulates backend HTTP calls for Trip Packing List management.
 */

/**
 * Fetch all packing items for a specific trip.
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Array>} List of packing items sorted by category and name
 */
export const getPackingItems = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/packing-items`);
  return response.data;
};

/**
 * Fetch packing list progress summary for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Object>} Summary object { totalItems, packedItems, unpackedItems, completionPercentage }
 */
export const getPackingSummary = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/packing-items/summary`);
  return response.data;
};

/**
 * Fetch a single packing item by ID.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} itemId - Packing Item ID
 * @returns {Promise<Object>} Packing item object
 */
export const getPackingItem = async (tripId, itemId) => {
  const response = await api.get(`/trips/${tripId}/packing-items/${itemId}`);
  return response.data;
};

/**
 * Create a new packing item for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @param {Object} data - Payload { itemName, category, quantity, packed, notes }
 * @returns {Promise<Object>} Created packing item object
 */
export const createPackingItem = async (tripId, data) => {
  const response = await api.post(`/trips/${tripId}/packing-items`, data);
  return response.data;
};

/**
 * Update an existing packing item.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} itemId - Packing Item ID
 * @param {Object} data - Updated payload { itemName, category, quantity, packed, notes }
 * @returns {Promise<Object>} Updated packing item object
 */
export const updatePackingItem = async (tripId, itemId, data) => {
  const response = await api.put(`/trips/${tripId}/packing-items/${itemId}`, data);
  return response.data;
};

/**
 * Toggle the packed boolean status for a packing item.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} itemId - Packing Item ID
 * @returns {Promise<Object>} Updated packing item object with inverted packed status
 */
export const togglePackedStatus = async (tripId, itemId) => {
  const response = await api.patch(`/trips/${tripId}/packing-items/${itemId}/toggle`);
  return response.data;
};

/**
 * Delete a packing item.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} itemId - Packing Item ID
 * @returns {Promise<void>}
 */
export const deletePackingItem = async (tripId, itemId) => {
  const response = await api.delete(`/trips/${tripId}/packing-items/${itemId}`);
  return response.data;
};

const packingService = {
  getPackingItems,
  getPackingSummary,
  getPackingItem,
  createPackingItem,
  updatePackingItem,
  togglePackedStatus,
  deletePackingItem,
};

export default packingService;
