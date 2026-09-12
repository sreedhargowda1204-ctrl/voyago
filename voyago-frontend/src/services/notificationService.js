import api from './api';

/**
 * Fetches all notifications for the currently authenticated user.
 * GET /api/notifications
 * @returns {Promise<Array>} List of NotificationResponse objects
 */
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data || [];
};

/**
 * Fetches unread notification count for the currently authenticated user.
 * GET /api/notifications/unread-count
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data?.unreadCount || 0;
};

/**
 * Marks an individual notification as read.
 * PATCH /api/notifications/{id}/read
 * @param {number|string} id
 * @returns {Promise<Object>} Updated NotificationResponse object
 */
export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Marks all notifications for the currently authenticated user as read.
 * PATCH /api/notifications/read-all
 * @returns {Promise<Object>} Object containing updated count
 */
export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

/**
 * Deletes an individual notification.
 * DELETE /api/notifications/{id}
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export const deleteNotification = async (id) => {
  await api.delete(`/notifications/${id}`);
};
