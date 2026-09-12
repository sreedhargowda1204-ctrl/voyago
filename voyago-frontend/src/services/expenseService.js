import api from './api';

/**
 * Trip Expense API Service
 * Encapsulates backend HTTP calls for Trip Expense management.
 */

/**
 * Create a new expense for a trip.
 * @param {string|number} tripId - Parent Trip ID
 * @param {Object} data - Expense payload { category, amount, description, expenseDate, paymentMethod }
 * @returns {Promise<Object>} Created expense object
 */
export const createExpense = async (tripId, data) => {
  const response = await api.post(`/trips/${tripId}/expenses`, data);
  return response.data;
};

/**
 * Fetch all expenses for a specific trip.
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Array>} List of expenses ordered by newest date first
 */
export const getExpenses = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/expenses`);
  return response.data;
};

/**
 * Fetch a single expense by ID.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} expenseId - Expense ID
 * @returns {Promise<Object>} Expense details object
 */
export const getExpense = async (tripId, expenseId) => {
  const response = await api.get(`/trips/${tripId}/expenses/${expenseId}`);
  return response.data;
};

/**
 * Update an existing expense.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} expenseId - Expense ID
 * @param {Object} data - Updated expense payload
 * @returns {Promise<Object>} Updated expense object
 */
export const updateExpense = async (tripId, expenseId, data) => {
  const response = await api.put(`/trips/${tripId}/expenses/${expenseId}`, data);
  return response.data;
};

/**
 * Delete an expense.
 * @param {string|number} tripId - Parent Trip ID
 * @param {string|number} expenseId - Expense ID
 * @returns {Promise<void>}
 */
export const deleteExpense = async (tripId, expenseId) => {
  const response = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
  return response.data;
};

const expenseService = {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
};

export default expenseService;
