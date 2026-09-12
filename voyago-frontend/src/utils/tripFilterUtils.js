/**
 * Trip Filter and Sort Utilities
 * Provides pure helper functions for client-side trip search, status determination, and sorting.
 */

export const TRIP_STATUS = {
  ALL: 'ALL',
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
};

export const SORT_OPTIONS = [
  { value: 'START_DATE_DESC', label: 'Start Date — Newest First' },
  { value: 'START_DATE_ASC', label: 'Start Date — Oldest First' },
  { value: 'END_DATE_DESC', label: 'End Date — Newest First' },
  { value: 'END_DATE_ASC', label: 'End Date — Oldest First' },
  { value: 'RECENTLY_CREATED', label: 'Recently Created' },
  { value: 'TITLE_ASC', label: 'Title — A to Z' },
  { value: 'TITLE_DESC', label: 'Title — Z to A' },
];

export const DEFAULT_SORT = 'START_DATE_DESC';

/**
 * Format Date object to local YYYY-MM-DD string
 */
export const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Determine a trip's status relative to today's date
 * @param {Object} trip - Trip object containing startDate and endDate (YYYY-MM-DD)
 * @returns {'UPCOMING' | 'ONGOING' | 'COMPLETED'}
 */
export const getTripStatus = (trip) => {
  if (!trip || !trip.startDate || !trip.endDate) {
    return TRIP_STATUS.UPCOMING;
  }

  const today = getTodayString();
  const startDate = String(trip.startDate).trim();
  const endDate = String(trip.endDate).trim();

  if (today < startDate) {
    return TRIP_STATUS.UPCOMING;
  } else if (today >= startDate && today <= endDate) {
    return TRIP_STATUS.ONGOING;
  } else {
    return TRIP_STATUS.COMPLETED;
  }
};

/**
 * Filter and sort a list of trips
 * @param {Array} trips - Raw array of trip objects
 * @param {Object} options - { searchTerm, statusFilter, sortBy }
 * @returns {Array} Filtered and sorted trip array
 */
export const filterAndSortTrips = (
  trips = [],
  { searchTerm = '', statusFilter = TRIP_STATUS.ALL, sortBy = DEFAULT_SORT } = {}
) => {
  if (!Array.isArray(trips)) return [];

  const query = searchTerm.trim().toLowerCase();

  // 1. Filter trips
  const filtered = trips.filter((trip) => {
    if (!trip) return false;

    // Search filter (matches title or destination case-insensitively)
    if (query) {
      const title = (trip.title || '').toLowerCase();
      const destination = (trip.destination || '').toLowerCase();
      const matchesSearch = title.includes(query) || destination.includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter && statusFilter !== TRIP_STATUS.ALL) {
      const status = getTripStatus(trip);
      if (status !== statusFilter) return false;
    }

    return true;
  });

  // 2. Sort trips (without mutating original filtered array)
  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'START_DATE_ASC': {
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        return dateA.localeCompare(dateB);
      }
      case 'START_DATE_DESC': {
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        return dateB.localeCompare(dateA);
      }
      case 'END_DATE_ASC': {
        const dateA = a.endDate || '';
        const dateB = b.endDate || '';
        return dateA.localeCompare(dateB);
      }
      case 'END_DATE_DESC': {
        const dateA = a.endDate || '';
        const dateB = b.endDate || '';
        return dateB.localeCompare(dateA);
      }
      case 'RECENTLY_CREATED': {
        // If createdAt is present (e.g. ISO timestamp), sort by it; otherwise fallback to trip id descending
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return (b.id || 0) - (a.id || 0);
      }
      case 'TITLE_ASC': {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
      }
      case 'TITLE_DESC': {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleB.localeCompare(titleA, undefined, { sensitivity: 'base' });
      }
      default:
        return 0;
    }
  });
};
