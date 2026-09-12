import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Compass,
  CalendarCheck,
  AlertTriangle,
  Info,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const containerRef = useRef(null);
  const bellButtonRef = useRef(null);

  // Fetch unread count for badge
  const fetchUnreadBadge = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently ignore background badge errors to avoid UI disruption
    }
  }, [isAuthenticated]);

  // Fetch full list of notifications
  const fetchNotificationList = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      const count = list.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to connect to server. Please check your network.');
      } else {
        setError('Failed to load notifications.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial badge check & conservative 60-second polling
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadBadge();

    const intervalId = setInterval(() => {
      fetchUnreadBadge();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchUnreadBadge]);

  // Fetch notifications when opening the dropdown
  useEffect(() => {
    if (isOpen) {
      fetchNotificationList();
    }
  }, [isOpen, fetchNotificationList]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key to close dropdown
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        bellButtonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // Mark an individual notification as read
  const handleMarkAsRead = async (notification, event) => {
    if (event) event.stopPropagation();
    if (notification.read) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markAsRead(notification.id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Rollback on failure
      fetchNotificationList();
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotificationList();
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Delete an individual notification
  const handleDelete = async (id, event) => {
    if (event) event.stopPropagation();

    const targetNotification = notifications.find((n) => n.id === id);
    const wasUnread = targetNotification && !targetNotification.read;

    // Optimistic remove
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotificationList();
    }
  };

  // Navigate to trip when clicking "View Trip"
  const handleViewTrip = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification);
    }
    setIsOpen(false);
    if (notification.tripId) {
      navigate('/dashboard', { state: { selectedTripId: notification.tripId } });
    } else {
      navigate('/dashboard');
    }
  };

  // Format relative or absolute timestamp
  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 172800) return 'Yesterday';

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  };

  // Render type-specific visual badge & icon
  const renderTypeIcon = (type) => {
    switch (type) {
      case 'TRIP_STARTING':
        return (
          <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="h-4 w-4" />
          </div>
        );
      case 'TRIP_STARTED':
        return (
          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="h-4 w-4" />
          </div>
        );
      case 'ITINERARY_TODAY':
        return (
          <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <CalendarCheck className="h-4 w-4" />
          </div>
        );
      case 'BUDGET_EXCEEDED':
        return (
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 shadow-xs">
            <Info className="h-4 w-4" />
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const badgeText = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        ref={bellButtonRef}
        onClick={toggleDropdown}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer ${
          isOpen ? 'bg-slate-100 text-blue-600' : ''
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white shadow-xs animate-in fade-in zoom-in duration-200"
            aria-hidden="true"
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          role="region"
          aria-label="Notifications Panel"
          className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Panel Header */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
                title="Mark all notifications as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Panel Body */}
          <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {/* Loading State */}
            {isLoading && (
              <div className="py-10 text-center">
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Loading notifications...</p>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700 mb-3">{error}</p>
                <button
                  onClick={fetchNotificationList}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && notifications.length === 0 && (
              <div className="py-12 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">You're all caught up!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Trip reminders, itinerary highlights, and budget alerts will appear here.
                </p>
              </div>
            )}

            {/* Notification Items */}
            {!isLoading &&
              !error &&
              notifications.map((notification) => {
                const timeAgo = formatTimestamp(notification.createdAt);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleViewTrip(notification)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group relative ${
                      !notification.read ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notification.read && (
                      <span
                        className="absolute top-3.5 left-1.5 h-1.5 w-1.5 rounded-full bg-blue-600"
                        title="Unread"
                      />
                    )}

                    {/* Type Visual Icon */}
                    {renderTypeIcon(notification.type)}

                    {/* Content */}
                    <div className="flex-grow min-w-0 pr-1">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4
                          className={`text-xs font-semibold tracking-tight truncate ${
                            !notification.read ? 'text-slate-900 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {timeAgo && (
                          <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      {/* Action links / buttons */}
                      <div className="flex items-center justify-between pt-1">
                        {notification.tripId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
                            <span>View Trip</span>
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification, e)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete notification"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
