import React, { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import Loading from './Loading';
import ItineraryItemModal from './ItineraryItemModal';
import DeleteItineraryItemModal from './DeleteItineraryItemModal';
import WeatherSection from './WeatherSection';
import PlacesSection from './PlacesSection';
import MapSection from './MapSection';
import BudgetSection from './BudgetSection';
import TripAnalytics from './TripAnalytics';
import PackingListSection from './PackingListSection';
import TripShareSection from './TripShareSection';
import {
  getItinerary,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
} from '../services/itineraryService';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  RefreshCw,
  CalendarCheck,
  FileText,
  Printer,
} from 'lucide-react';

const ItinerarySection = ({ trip, onBack }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Create / Edit Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [itemModalError, setItemModalError] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const tripId = trip?.id;

  useEffect(() => {
    let isMounted = true;

    async function fetchItinerary() {
      if (!tripId) return;

      try {
        const data = await getItinerary(tripId);
        if (isMounted) {
          setItems(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        console.error('Failed to load itinerary:', err);
        if (isMounted) {
          if (err.response?.data?.message) {
            setError(err.response.data.message);
          } else if (err.message === 'Network Error' || !err.response) {
            setError('Unable to reach server. Please check backend connection.');
          } else {
            setError('Failed to load itinerary items. Please try again.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingTripsFalse();
        }
      }
    }

    function setIsLoadingTripsFalse() {
      setIsLoading(false);
    }

    fetchItinerary();

    return () => {
      isMounted = false;
    };
  }, [tripId, refreshTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setError('');
    setRefreshTrigger((prev) => prev + 1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setItemModalError('');
    setIsItemModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemModalError('');
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    if (!isSubmittingItem) {
      setIsItemModalOpen(false);
      setEditingItem(null);
      setItemModalError('');
    }
  };

  // Submit Create or Update
  const handleSaveItem = async (formData) => {
    setIsSubmittingItem(true);
    setItemModalError('');

    try {
      if (editingItem?.id) {
        await updateItineraryItem(trip.id, editingItem.id, formData);
      } else {
        await createItineraryItem(trip.id, formData);
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to save itinerary item:', err);
      if (err.response?.data?.message) {
        setItemModalError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setItemModalError(firstError || 'Validation failed. Please check inputs.');
      } else {
        setItemModalError('Failed to save activity. Please try again.');
      }
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingItem) {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setDeleteError('');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;

    setIsDeletingItem(true);
    setDeleteError('');

    try {
      await deleteItineraryItem(trip.id, itemToDelete.id);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete itinerary item:', err);
      if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('Failed to delete activity. Please try again.');
      }
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Format time helper (HH:mm -> 12-hour or formatted string)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hourStr, minStr] = timeString.split(':');
      let hour = parseInt(hourStr, 10);
      const minutes = minStr ? minStr.substring(0, 2) : '00';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  // Group items by date for a chronological timeline view
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const d = item.date || 'Unscheduled';
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(item);
    });
    return groups;
  }, [items]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedItems).sort();
  }, [groupedItems]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Trips</span>
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {trip.title}
            </h2>
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              <MapPin className="h-3.5 w-3.5" />
              <span>{trip.destination}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            to={`/trips/${trip.id}/print`}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            title="Print or Export Trip"
          >
            <Printer className="h-4 w-4" />
            <span>Print Trip</span>
          </Link>

          <Button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Activity</span>
          </Button>
        </div>
      </div>

      {/* Trip Overview & Analytics Section */}
      <TripAnalytics trip={trip} />

      {/* Destination Weather Section */}
      <WeatherSection destination={trip.destination} />

      {/* Destination Places & Attractions Section */}
      <PlacesSection destination={trip.destination} />

      {/* Interactive Map & Routes Section */}
      <MapSection destination={trip.destination} />

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 bg-white rounded-2xl border border-slate-100">
          <Loading />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-rose-900 mb-1">Failed to load itinerary</h3>
          <p className="text-sm text-rose-700 max-w-md mx-auto mb-4">{error}</p>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="inline-flex items-center space-x-2 text-rose-700 border-rose-300 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="bg-white rounded-2xl p-10 sm:p-12 shadow-sm border border-slate-100 text-center">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No activities planned yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Build your day-by-day itinerary! Add sightseeing, dining reservations, flights, or activities with dates, times, and notes.
          </p>
          <Button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-6 py-2.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Activity</span>
          </Button>
        </div>
      )}

      {/* Timeline View */}
      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
              {/* Date Section Header */}
              <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
                <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{formatDate(dateKey)}</h3>
                  <p className="text-xs text-slate-500">
                    {groupedItems[dateKey].length} {groupedItems[dateKey].length === 1 ? 'activity' : 'activities'} scheduled
                  </p>
                </div>
              </div>

              {/* Items in Date */}
              <div className="space-y-4">
                {groupedItems[dateKey].map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-slate-50 hover:bg-white rounded-xl p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.time && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(item.time)}</span>
                          </span>
                        )}
                        <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                      </div>

                      {item.location && (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      )}

                      {item.description && (
                        <div className="flex items-start space-x-1.5 text-xs text-slate-600 bg-white/60 p-2.5 rounded-lg border border-slate-100">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed whitespace-pre-wrap">{item.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="Edit Activity"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Activity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trip Budget & Expenses Section */}
      <div id="trip-budget-section">
        <BudgetSection tripId={trip.id} />
      </div>

      {/* Trip Packing List Section */}
      <PackingListSection tripId={trip.id} />

      {/* Trip Sharing Section */}
      <TripShareSection tripId={trip.id} />

      {/* Create / Edit Modal */}
      <ItineraryItemModal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        onSubmit={handleSaveItem}
        initialData={editingItem}
        isLoading={isSubmittingItem}
        serverError={itemModalError}
      />

      {/* Delete Modal */}
      <DeleteItineraryItemModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
        isLoading={isDeletingItem}
        error={deleteError}
      />
    </div>
  );
};

export default ItinerarySection;
