import api from './api';

/**
 * Trip Sharing API Service
 * Encapsulates backend HTTP calls for Trip Sharing and Public Read-Only Trip View.
 */

/**
 * Generate a new share link or retrieve existing active share for a trip (Owner only).
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Object>} TripShareResponse { shareToken, shareUrl, active, createdAt }
 */
export const createShare = async (tripId) => {
  const response = await api.post(`/trips/${tripId}/share`);
  return response.data;
};

/**
 * Fetch current active share status for a trip (Owner only).
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<Object>} TripShareResponse { shareToken, shareUrl, active, createdAt }
 */
export const getShare = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/share`);
  return response.data;
};

/**
 * Revoke/deactivate the active share link for a trip (Owner only).
 * @param {string|number} tripId - Parent Trip ID
 * @returns {Promise<void>}
 */
export const revokeShare = async (tripId) => {
  const response = await api.delete(`/trips/${tripId}/share`);
  return response.data;
};

/**
 * Fetch public read-only trip data by share token (Unauthenticated public).
 * @param {string} shareToken - Cryptographic share token
 * @returns {Promise<Object>} PublicTripResponse
 */
export const getPublicTrip = async (shareToken) => {
  const response = await api.get(`/shared/trips/${encodeURIComponent(shareToken)}`);
  return response.data;
};

const shareService = {
  createShare,
  getShare,
  revokeShare,
  getPublicTrip,
};

export default shareService;
