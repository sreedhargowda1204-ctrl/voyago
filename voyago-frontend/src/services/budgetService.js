import api from './api';

/**
 * Trip Budget API Service
 * Encapsulates backend HTTP calls for Trip Budget and Summary management.
 */

/**
 * Create a budget for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @param {Object} data - Budget payload { totalBudget, currency }
 * @returns {Promise<Object>} Created budget object
 */
export const createBudget = async (tripId, data) => {
  const response = await api.post(`/trips/${tripId}/budget`, data);
  return response.data;
};

/**
 * Fetch the budget for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Object>} Trip budget object
 */
export const getBudget = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/budget`);
  return response.data;
};

/**
 * Update the budget for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @param {Object} data - Updated budget payload { totalBudget, currency }
 * @returns {Promise<Object>} Updated budget object
 */
export const updateBudget = async (tripId, data) => {
  const response = await api.put(`/trips/${tripId}/budget`, data);
  return response.data;
};

/**
 * Delete the budget for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<void>}
 */
export const deleteBudget = async (tripId) => {
  const response = await api.delete(`/trips/${tripId}/budget`);
  return response.data;
};

/**
 * Fetch the budget summary (totalBudget, totalSpent, remainingBudget, expenseCount).
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Object>} Budget summary object
 */
export const getBudgetSummary = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/budget/summary`);
  return response.data;
};

const budgetService = {
  createBudget,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary,
};

export default budgetService;
