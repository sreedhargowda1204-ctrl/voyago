import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicTrip } from '../services/shareService';
import Loading from '../components/Loading';
import Button from '../components/Button';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Wallet,
  AlertCircle,
  Receipt,
  Luggage,
  CheckCircle2,
  Circle,
  RefreshCw,
  Sparkles,
  Plane,
  Building,
  Utensils,
  Car,
  Ticket,
  ShoppingBag,
  MoreHorizontal,
  Shirt,
  Smartphone,
  HeartPulse,
  Package,
  Home,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';

// Category map for Expense Styling
const EXPENSE_CATEGORY_CONFIG = {
  FLIGHT: { label: 'Flight', icon: Plane, bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  HOTEL: { label: 'Hotel', icon: Building, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FOOD: { label: 'Food', icon: Utensils, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  TRANSPORT: { label: 'Transport', icon: Car, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ACTIVITY: { label: 'Activity', icon: Ticket, bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHOPPING: { label: 'Shopping', icon: ShoppingBag, bg: 'bg-pink-50 text-pink-700 border-pink-200' },
  OTHER: { label: 'Other', icon: MoreHorizontal, bg: 'bg-slate-100 text-slate-700 border-slate-200' },
};

// Category map for Packing Items Styling
const PACKING_CATEGORY_CONFIG = {
  CLOTHING: { label: 'Clothing', icon: Shirt, bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  TOILETRIES: { label: 'Toiletries', icon: Sparkles, bg: 'bg-pink-50 text-pink-700 border-pink-200' },
  ELECTRONICS: { label: 'Electronics', icon: Smartphone, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  DOCUMENTS: { label: 'Documents', icon: FileText, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  MEDICINE: { label: 'Medicine', icon: HeartPulse, bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  ACCESSORIES: { label: 'Accessories', icon: ShoppingBag, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OTHER: { label: 'Other', icon: Package, bg: 'bg-slate-100 text-slate-700 border-slate-200' },
};

// Safe Currency Formatter
const formatCurrency = (amount, currency = 'INR') => {
  if (typeof amount !== 'number' || isNaN(amount)) return `0.00 ${currency}`;
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${absFormatted} ${currency}`;
};

// Safe Date Parser
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const formatDisplayDate = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr || 'N/A';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const minutes = minStr ? minStr.substring(0, 2) : '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
};

const PublicTripPage = () => {
  const { shareToken } = useParams();

  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTrip = useCallback(async () => {
    if (!shareToken) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsNotFound(false);
    setErrorMessage('');

    try {
      const data = await getPublicTrip(shareToken);
      setTrip(data);
    } catch (err) {
      console.warn('Failed to load shared trip:', err);
      if (err.response?.status === 404) {
        setIsNotFound(true);
      } else if (err.message === 'Network Error' || !err.response) {
        setErrorMessage('Unable to reach server. Please check your internet connection.');
      } else {
        setErrorMessage('Failed to load shared trip.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Trip Duration in Days (Inclusive)
  const tripDurationDays = useMemo(() => {
    const start = parseLocalDate(trip?.startDate);
    const end = parseLocalDate(trip?.endDate);
    if (!start || !end) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 1;
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }, [trip?.startDate, trip?.endDate]);

  // Group Itinerary by Date
  const groupedItinerary = useMemo(() => {
    if (!trip?.itineraryItems || trip.itineraryItems.length === 0) return {};
    const groups = {};
    trip.itineraryItems.forEach((item) => {
      const d = item.date || 'Unscheduled';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return groups;
  }, [trip]);

  const sortedItineraryDates = useMemo(() => {
    return Object.keys(groupedItinerary).sort();
  }, [groupedItinerary]);

  // Group Packing Items by Category
  const groupedPacking = useMemo(() => {
    if (!trip?.packingItems || trip.packingItems.length === 0) return {};
    const groups = {};
    trip.packingItems.forEach((item) => {
      const cat = (item.category || 'OTHER').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [trip]);

  const sortedPackingCategories = useMemo(() => {
    return Object.keys(groupedPacking).sort();
  }, [groupedPacking]);

  // Budget calculations
  const currency = trip?.budgetSummary?.currency || 'INR';
  const totalBudget = trip?.budgetSummary?.totalBudget || 0;
  const totalSpent = trip?.budgetSummary?.totalSpent || 0;
  const remainingBudget = trip?.budgetSummary?.remainingBudget ?? (totalBudget - totalSpent);
  const isOverBudget = remainingBudget < 0;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-blue-600 mb-4">
          <Compass className="h-8 w-8 animate-spin" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Voyago</span>
        </div>
        <p className="text-sm text-slate-500 mb-6">Loading shared trip...</p>
        <Loading />
      </div>
    );
  }

  // 2. Not Found (404 - Invalid or Revoked)
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-100 py-4 px-6 sm:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-blue-600">
            <Compass className="h-6 w-6" />
            <span className="text-lg font-black tracking-tight text-slate-900">Voyago</span>
          </Link>
          <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            Sign In
          </Link>
        </header>

        {/* 404 Card */}
        <main className="max-w-md mx-auto my-auto p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
          <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Trip Not Found</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            This sharing link is invalid or has been revoked by the trip owner.
          </p>
          <Link to="/">
            <Button className="w-full inline-flex items-center justify-center space-x-2 cursor-pointer shadow-sm">
              <Home className="h-4 w-4" />
              <span>Go to Voyago Home</span>
            </Button>
          </Link>
        </main>

        <footer className="text-center py-6 text-xs text-slate-400">
          Powered by Voyago Travel Planner
        </footer>
      </div>
    );
  }

  // 3. Network or Server Error
  if (errorMessage && !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-white border-b border-slate-100 py-4 px-6 sm:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-blue-600">
            <Compass className="h-6 w-6" />
            <span className="text-lg font-black tracking-tight text-slate-900">Voyago</span>
          </Link>
        </header>

        <main className="max-w-md mx-auto my-auto p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Issue</h2>
          <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
          <Button
            onClick={fetchTrip}
            className="w-full inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Loading</span>
          </Button>
        </main>

        <footer className="text-center py-6 text-xs text-slate-400">
          Powered by Voyago Travel Planner
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Branding Banner */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Link to="/" className="flex items-center space-x-2 text-blue-600">
              <Compass className="h-6 w-6" />
              <span className="text-lg font-black tracking-tight text-slate-900">Voyago</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              Shared Trip
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/register"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors hidden sm:inline-block"
            >
              Plan Your Own Trip
            </Link>
            <Link
              to="/login"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 1. Trip Header Banner */}
        <section
          aria-label="Trip Header"
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {trip.title}
                </h1>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{trip.destination}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 pt-1">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    {formatDisplayDate(trip.startDate)} — {formatDisplayDate(trip.endDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {tripDurationDays} {tripDurationDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 self-start">
              Read-Only View
            </span>
          </div>

          {trip.notes && (
            <div className="pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <span className="font-semibold text-slate-700 block mb-1">Trip Notes:</span>
              <p className="whitespace-pre-wrap">{trip.notes}</p>
            </div>
          )}
        </section>

        {/* 2. Public Itinerary Section */}
        <section
          aria-label="Itinerary Timeline"
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
        >
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Itinerary Schedule</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {trip.itineraryItems?.length || 0} planned activities
              </p>
            </div>
          </div>

          {(!trip.itineraryItems || trip.itineraryItems.length === 0) ? (
            <div className="py-8 text-center bg-slate-50/70 rounded-2xl border border-slate-100 text-sm text-slate-500">
              No itinerary activities planned for this trip.
            </div>
          ) : (
            <div className="space-y-6">
              {sortedItineraryDates.map((dateKey) => (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{formatDisplayDate(dateKey)}</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({groupedItinerary[dateKey].length} {groupedItinerary[dateKey].length === 1 ? 'activity' : 'activities'})
                    </span>
                  </div>

                  <div className="space-y-3 pl-4 border-l-2 border-slate-100 ml-1">
                    {groupedItinerary[dateKey].map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-1.5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                          {item.time && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 font-mono">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(item.time)}</span>
                            </span>
                          )}
                        </div>

                        {item.location && (
                          <div className="flex items-center space-x-1 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}

                        {item.description && (
                          <p className="text-xs text-slate-600 whitespace-pre-wrap pt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Public Budget & Expenses Section */}
        <section
          aria-label="Trip Finances"
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Trip Finances</h2>
                <p className="text-xs sm:text-sm text-slate-500">Budget summary and recorded expenses</p>
              </div>
            </div>

            {trip.budgetSummary?.currency && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {trip.budgetSummary.currency}
              </span>
            )}
          </div>

          {/* Over-Budget Alert Banner if spending > budget */}
          {isOverBudget && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <span className="text-sm font-bold">This trip is currently over budget</span>
              </div>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-rose-200 text-rose-900">
                Deficit: {formatCurrency(remainingBudget, currency)}
              </span>
            </div>
          )}

          {/* Budget Metric Cards (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Allocated Budget
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono truncate">
                {trip.budgetSummary?.totalBudget ? formatCurrency(totalBudget, currency) : 'No Budget Set'}
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Total Spent
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono truncate">
                {formatCurrency(totalSpent, currency)}
              </div>
            </div>

            <div
              className={`rounded-2xl p-4.5 border ${
                isOverBudget ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Remaining Balance
              </span>
              <div
                className={`text-xl font-extrabold font-mono truncate ${
                  isOverBudget ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(remainingBudget, currency)}
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Expense Items
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {trip.budgetSummary?.expenseCount || trip.expenses?.length || 0}
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-slate-500" />
              <span>Recorded Expenses</span>
            </h3>

            {(!trip.expenses || trip.expenses.length === 0) ? (
              <div className="py-6 text-center bg-slate-50/70 rounded-2xl border border-slate-100 text-xs text-slate-500">
                No expenses recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {trip.expenses.map((exp) => {
                  const cat = (exp.category || 'OTHER').toUpperCase();
                  const config = EXPENSE_CATEGORY_CONFIG[cat] || EXPENSE_CATEGORY_CONFIG.OTHER;
                  const Icon = config.icon;

                  return (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/60 border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-0.5 truncate flex-grow">
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.bg}`}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{exp.category}</span>
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                            {exp.description || config.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          {exp.expenseDate && <span>{formatDisplayDate(exp.expenseDate)}</span>}
                          {exp.paymentMethod && (
                            <>
                              <span>•</span>
                              <span>{exp.paymentMethod}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                          {formatCurrency(exp.amount, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 4. Public Packing List Section */}
        <section
          aria-label="Packing List"
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Luggage className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Packing List</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {trip.packingSummary?.packedItems || 0} of {trip.packingSummary?.totalItems || 0} items packed ({trip.packingSummary?.completionPercentage?.toFixed(0) || 0}%)
                </p>
              </div>
            </div>

            {trip.packingSummary?.completionPercentage === 100 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCheck className="h-3 w-3 mr-1" />
                All Packed
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {trip.packingSummary && trip.packingSummary.totalItems > 0 && (
            <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Packing Progress</span>
                <span className="font-bold text-slate-900">
                  {trip.packingSummary.completionPercentage?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, trip.packingSummary.completionPercentage || 0))}%` }}
                />
              </div>
            </div>
          )}

          {/* Packing Items Grouped by Category */}
          {(!trip.packingItems || trip.packingItems.length === 0) ? (
            <div className="py-6 text-center bg-slate-50/70 rounded-2xl border border-slate-100 text-xs text-slate-500">
              No packing items.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPackingCategories.map((catKey) => {
                const groupList = groupedPacking[catKey] || [];
                const config = PACKING_CATEGORY_CONFIG[catKey] || PACKING_CATEGORY_CONFIG.OTHER;
                const Icon = config.icon;

                return (
                  <div key={catKey} className="rounded-2xl border border-slate-200/80 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center space-x-2">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                        <span>{config.label}</span>
                      </span>
                      <span className="text-slate-400 font-normal">
                        {groupList.filter((i) => i.packed).length} / {groupList.length} packed
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 p-2">
                      {groupList.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2.5 flex items-center justify-between gap-3 text-xs ${
                            item.packed ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            {item.packed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                            )}
                            <span className="font-semibold truncate">{item.itemName}</span>
                            {item.quantity > 1 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                                x{item.quantity}
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-12">
        <p className="flex items-center justify-center space-x-1.5 mb-1">
          <Compass className="h-4 w-4 text-blue-600" />
          <span className="font-bold text-slate-700">Voyago</span>
          <span>— Smart Travel Planning</span>
        </p>
        <p>This is a shared read-only trip overview.</p>
      </footer>
    </div>
  );
};

export default PublicTripPage;
