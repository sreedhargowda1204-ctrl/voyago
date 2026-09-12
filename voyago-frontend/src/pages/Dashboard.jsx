import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Loading from '../components/Loading';
import TripModal from '../components/TripModal';
import DeleteTripModal from '../components/DeleteTripModal';
import ItinerarySection from '../components/ItinerarySection';
import TripFilterBar from '../components/TripFilterBar';
import { useAuth } from '../context/AuthContext';
import {
  getMyTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from '../services/tripService';
import {
  filterAndSortTrips,
  getTripStatus,
  TRIP_STATUS,
  DEFAULT_SORT,
} from '../utils/tripFilterUtils';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  Compass,
  Plus,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Edit3,
  Trash2,
  AlertCircle,
  RefreshCw,
  CalendarCheck,
  SearchX,
  Printer,
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Trips list state
  const [trips, setTrips] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [tripsError, setTripsError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(TRIP_STATUS.ALL);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);

  // Active Itinerary View state
  const [activeItineraryTrip, setActiveItineraryTrip] = useState(null);

  // Auto-select trip if navigated from notification
  useEffect(() => {
    const requestedTripId = location.state?.selectedTripId;
    if (requestedTripId && trips.length > 0) {
      const match = trips.find((t) => String(t.id) === String(requestedTripId));
      if (match) {
        setActiveItineraryTrip(match);
      }
    }
  }, [location.state, trips]);

  // Trip Modal (Create / Edit) state
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);
  const [tripModalError, setTripModalError] = useState('');

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch all trips for the authenticated user
  useEffect(() => {
    let isMounted = true;

    async function loadTrips() {
      try {
        const data = await getMyTrips();
        if (isMounted) {
          const tripsList = Array.isArray(data) ? data : [];
          setTrips(tripsList);
          setTripsError('');

          // Update activeItineraryTrip reference if it exists
          setActiveItineraryTrip((prev) => {
            if (!prev) return null;
            const updated = tripsList.find((t) => t.id === prev.id);
            return updated || null;
          });
        }
      } catch (err) {
        console.error('Failed to load trips:', err);
        if (isMounted) {
          if (err.response?.data?.message) {
            setTripsError(err.response.data.message);
          } else if (err.message === 'Network Error' || !err.response) {
            setTripsError('Unable to connect to backend service. Please check server status.');
          } else {
            setTripsError('Failed to load your trips. Please try again.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingTrips(false);
        }
      }
    }

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const handleRetry = () => {
    setIsLoadingTrips(true);
    setTripsError('');
    setRefreshIndex((prev) => prev + 1);
  };

  // Open Create Trip modal
  const handleOpenCreateModal = () => {
    setEditingTrip(null);
    setTripModalError('');
    setIsTripModalOpen(true);
  };

  // Open Edit Trip modal
  const handleOpenEditModal = (trip) => {
    setEditingTrip(trip);
    setTripModalError('');
    setIsTripModalOpen(true);
  };

  // Close Trip modal
  const handleCloseTripModal = () => {
    if (!isSubmittingTrip) {
      setIsTripModalOpen(false);
      setEditingTrip(null);
      setTripModalError('');
    }
  };

  // Handle Create or Update Trip submission
  const handleSaveTrip = async (formData) => {
    setIsSubmittingTrip(true);
    setTripModalError('');

    try {
      if (editingTrip) {
        await updateTrip(editingTrip.id, formData);
      } else {
        await createTrip(formData);
      }
      setIsTripModalOpen(false);
      setEditingTrip(null);
      setRefreshIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to save trip:', err);
      if (err.response?.data?.message) {
        setTripModalError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setTripModalError(firstError || 'Validation failed. Please check your inputs.');
      } else if (err.message === 'Network Error' || !err.response) {
        setTripModalError('Unable to reach server. Please check backend connection.');
      } else {
        setTripModalError('Failed to save trip. Please try again.');
      }
    } finally {
      setIsSubmittingTrip(false);
    }
  };

  // Open Delete confirmation dialog
  const handleOpenDeleteModal = (trip) => {
    setTripToDelete(trip);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // Close Delete dialog
  const handleCloseDeleteModal = () => {
    if (!isDeletingTrip) {
      setIsDeleteModalOpen(false);
      setTripToDelete(null);
      setDeleteError('');
    }
  };

  // Confirm Trip deletion
  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;

    setIsDeletingTrip(true);
    setDeleteError('');

    try {
      await deleteTrip(tripToDelete.id);
      if (activeItineraryTrip?.id === tripToDelete.id) {
        setActiveItineraryTrip(null);
      }
      setIsDeleteModalOpen(false);
      setTripToDelete(null);
      setRefreshIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('Failed to delete trip. Please try again later.');
      }
    } finally {
      setIsDeletingTrip(false);
    }
  };

  // Filter and sort derived trips list
  const filteredTrips = useMemo(() => {
    return filterAndSortTrips(trips, { searchTerm, statusFilter, sortBy });
  }, [trips, searchTerm, statusFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter(TRIP_STATUS.ALL);
    setSortBy(DEFAULT_SORT);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString(undefined, {
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

  // Render status badge for trip card
  const renderStatusBadge = (trip) => {
    const status = getTripStatus(trip);
    switch (status) {
      case TRIP_STATUS.ONGOING:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Clock className="h-3 w-3" />
            <span>Ongoing</span>
          </span>
        );
      case TRIP_STATUS.COMPLETED:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case TRIP_STATUS.UPCOMING:
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Calendar className="h-3 w-3" />
            <span>Upcoming</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* User Profile Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl border-2 border-blue-200 shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Welcome, {user?.name || 'Traveler'}!
                </h1>
                {user?.verified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5">Manage your travel profile, trips, and day-by-day itineraries</p>
            </div>
          </div>

          <Button
            onClick={logout}
            variant="outline"
            className="flex items-center space-x-2 text-rose-600 border-rose-200 hover:bg-rose-50 focus:ring-rose-500 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Name</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">{user?.name || 'Not provided'}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</span>
            </div>
            <p className="text-lg font-semibold text-slate-800 break-all">{user?.email || 'Not provided'}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">{user?.mobile || 'Not provided'}</p>
          </div>
        </div>

        {/* Conditional View: Itinerary vs Trip List */}
        {activeItineraryTrip ? (
          <ItinerarySection
            trip={activeItineraryTrip}
            onBack={() => setActiveItineraryTrip(null)}
          />
        ) : (
          /* My Trips Section */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Compass className="h-6 w-6 text-blue-600" />
                  <span>My Trips</span>
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Plan, organize, and view all your travel itineraries</p>
              </div>

              <Button
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Create Trip</span>
              </Button>
            </div>

            {/* Loading State */}
            {isLoadingTrips && (
              <div className="py-12 bg-white rounded-2xl border border-slate-100">
                <Loading />
              </div>
            )}

            {/* Error State */}
            {!isLoadingTrips && tripsError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-rose-900 mb-1">Failed to load trips</h3>
                <p className="text-sm text-rose-700 max-w-md mx-auto mb-4">{tripsError}</p>
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
            {!isLoadingTrips && !tripsError && trips.length === 0 && (
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Compass className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No trips planned yet</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  Start your next journey! Create your first travel itinerary with destinations, dates, and packing notes.
                </p>
                <Button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Plan Your First Trip</span>
                </Button>
              </div>
            )}

            {/* Trips Section Content */}
            {!isLoadingTrips && !tripsError && trips.length > 0 && (
              <div className="space-y-6">
                {/* Search, Filter & Sort Toolbar */}
                <TripFilterBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onClearFilters={handleClearFilters}
                  totalTripsCount={trips.length}
                  filteredTripsCount={filteredTrips.length}
                />

                {/* No Matches State (when search/filters produce 0 results) */}
                {filteredTrips.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 shadow-xs border border-slate-200/80 text-center">
                    <div className="h-16 w-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SearchX className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No trips match your filters</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                      We couldn't find any trips matching your current search or filter criteria. Try adjusting your search query, changing status, or resetting filters.
                    </p>
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      className="inline-flex items-center space-x-2 px-5 py-2.5 cursor-pointer text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Clear Filters</span>
                    </Button>
                  </div>
                ) : (
                  /* Filtered Trips Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                      >
                        <div className="p-6">
                          {/* Destination & Status Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[140px] sm:max-w-[160px]">{trip.destination}</span>
                            </div>
                            {renderStatusBadge(trip)}
                          </div>

                          <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight line-clamp-1">
                            {trip.title}
                          </h3>

                          {/* Dates */}
                          <div className="flex items-center space-x-2 text-sm text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-xs font-medium">
                              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </span>
                          </div>

                          {/* Notes */}
                          {trip.notes && (
                            <div className="text-xs text-slate-600 flex items-start space-x-2 mt-2 bg-slate-50/50 p-3 rounded-lg border border-slate-100/80">
                              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap">{trip.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions Footer */}
                        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => setActiveItineraryTrip(trip)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer border border-blue-200 shrink-0"
                            title="View and manage itinerary"
                          >
                            <CalendarCheck className="h-3.5 w-3.5" />
                            <span>View Itinerary</span>
                          </button>

                          <div className="flex items-center space-x-1 shrink-0">
                            <Link
                              to={`/trips/${trip.id}/print`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                              title="Print or Export Itinerary"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Print</span>
                            </Link>

                            <button
                              onClick={() => handleOpenEditModal(trip)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                              title="Edit Trip"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(trip)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Delete Trip"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create / Edit Trip Modal */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={handleCloseTripModal}
        onSubmit={handleSaveTrip}
        initialData={editingTrip}
        isLoading={isSubmittingTrip}
        serverError={tripModalError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTripModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        trip={tripToDelete}
        isLoading={isDeletingTrip}
        error={deleteError}
      />

      <Footer />
    </div>
  );
};

export default Dashboard;
