import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrip } from '../services/tripService';
import { getItinerary } from '../services/itineraryService';
import { getBudget, getBudgetSummary } from '../services/budgetService';
import { getExpenses } from '../services/expenseService';
import { getPackingItems, getPackingSummary } from '../services/packingService';
import Loading from '../components/Loading';
import Button from '../components/Button';
import {
  Compass,
  ArrowLeft,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Wallet,
  Receipt,
  Luggage,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';

// Format currency helper
const formatCurrency = (amount, currency = 'INR') => {
  if (typeof amount !== 'number' || isNaN(amount)) return `0.00 ${currency}`;
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${absFormatted} ${currency}`;
};

// Parse local YYYY-MM-DD safely
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

const PrintTripPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [budget, setBudget] = useState(null);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [packingSummary, setPackingSummary] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all trip data in parallel
  const loadAllTripData = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    setError('');

    try {
      // 1. Trip details (Mandatory)
      const tripData = await getTrip(tripId);
      setTrip(tripData);

      // 2. Auxiliary sections in parallel using allSettled to ensure resilient rendering
      const [
        itineraryRes,
        budgetRes,
        budgetSummaryRes,
        expensesRes,
        packingItemsRes,
        packingSummaryRes,
      ] = await Promise.allSettled([
        getItinerary(tripId),
        getBudget(tripId),
        getBudgetSummary(tripId),
        getExpenses(tripId),
        getPackingItems(tripId),
        getPackingSummary(tripId),
      ]);

      if (itineraryRes.status === 'fulfilled') {
        setItineraryItems(Array.isArray(itineraryRes.value) ? itineraryRes.value : []);
      }
      if (budgetRes.status === 'fulfilled') {
        setBudget(budgetRes.value);
      }
      if (budgetSummaryRes.status === 'fulfilled') {
        setBudgetSummary(budgetSummaryRes.value);
      }
      if (expensesRes.status === 'fulfilled') {
        setExpenses(Array.isArray(expensesRes.value) ? expensesRes.value : []);
      }
      if (packingItemsRes.status === 'fulfilled') {
        setPackingItems(Array.isArray(packingItemsRes.value) ? packingItemsRes.value : []);
      }
      if (packingSummaryRes.status === 'fulfilled') {
        setPackingSummary(packingSummaryRes.value);
      }
    } catch (err) {
      console.error('Failed to load trip for print:', err);
      if (err.response?.status === 404) {
        setError('Trip not found. It may have been removed or does not exist.');
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        setError('You do not have permission to view or print this trip.');
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to reach server. Please check your internet connection.');
      } else {
        setError('Failed to load trip data for printing. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadAllTripData();
  }, [loadAllTripData]);

  // Trip duration in days
  const tripDurationDays = useMemo(() => {
    const start = parseLocalDate(trip?.startDate);
    const end = parseLocalDate(trip?.endDate);
    if (!start || !end) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 1;
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }, [trip?.startDate, trip?.endDate]);

  // Group itinerary by date
  const groupedItinerary = useMemo(() => {
    if (!itineraryItems || itineraryItems.length === 0) return {};
    const groups = {};
    itineraryItems.forEach((item) => {
      const d = item.date || 'Unscheduled';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });
    return groups;
  }, [itineraryItems]);

  const sortedItineraryDates = useMemo(() => {
    return Object.keys(groupedItinerary).sort();
  }, [groupedItinerary]);

  // Group packing items by category
  const groupedPacking = useMemo(() => {
    if (!packingItems || packingItems.length === 0) return {};
    const groups = {};
    packingItems.forEach((item) => {
      const cat = (item.category || 'OTHER').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [packingItems]);

  const sortedPackingCategories = useMemo(() => {
    return Object.keys(groupedPacking).sort();
  }, [groupedPacking]);

  // Budget calculations
  const currency = budgetSummary?.currency || budget?.currency || 'INR';
  const totalBudget = budgetSummary?.totalBudget ?? budget?.totalBudget ?? 0;
  const totalSpent = budgetSummary?.totalSpent ?? 0;
  const remainingBudget = budgetSummary?.remainingBudget ?? (totalBudget - totalSpent);
  const isOverBudget = remainingBudget < 0;
  const hasBudget = Boolean(budget || budgetSummary);

  const handlePrint = () => {
    window.print();
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-blue-600 mb-4">
          <Compass className="h-8 w-8 animate-spin" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Voyago</span>
        </div>
        <p className="text-sm text-slate-500 mb-6">Preparing print-friendly itinerary...</p>
        <Loading />
      </div>
    );
  }

  // 2. Error State
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center">
          <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Trip</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Trip details could not be found.'}</p>
          <div className="flex items-center justify-center space-x-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="cursor-pointer"
            >
              Back to Dashboard
            </Button>
            <Button onClick={loadAllTripData} className="inline-flex items-center space-x-2 cursor-pointer">
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 print:bg-white text-slate-900 py-6 sm:py-10 print:py-0">
      {/* Top Action Control Bar (Hidden when printed) */}
      <aside
        aria-label="Print controls"
        className="max-w-4xl mx-auto mb-6 px-4 sm:px-0 flex flex-wrap items-center justify-between gap-4 print:hidden"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer bg-white px-4 py-2 rounded-xl shadow-2xs border border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-3">
          <Button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-5 py-2.5 shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Print or save as PDF"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </aside>

      {/* Printable Document Container */}
      <main
        id="printable-trip-document"
        className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-sm rounded-3xl border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none space-y-8"
      >
        {/* Document Header & Branding */}
        <header className="border-b border-slate-200 pb-6 break-inside-avoid">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <Compass className="h-5 w-5" />
                <span className="text-sm font-black tracking-wider uppercase">Voyago Travel Plan</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {trip.title}
              </h1>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <MapPin className="h-3.5 w-3.5" />
                <span>{trip.destination}</span>
              </span>
            </div>
          </div>

          {/* Dates and Duration */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 pt-2">
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

          {/* Trip Notes */}
          {trip.notes && (
            <div className="mt-4 p-3.5 bg-slate-50 print:bg-slate-50/50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1">Notes:</span>
              <p className="whitespace-pre-wrap">{trip.notes}</p>
            </div>
          )}
        </header>

        {/* 1. Itinerary Section */}
        <section aria-label="Itinerary Schedule" className="space-y-4 break-inside-avoid">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Itinerary Schedule</h2>
            <span className="text-xs text-slate-500 font-normal">
              ({itineraryItems.length} {itineraryItems.length === 1 ? 'activity' : 'activities'})
            </span>
          </div>

          {itineraryItems.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 italic">No itinerary activities planned.</p>
          ) : (
            <div className="space-y-5">
              {sortedItineraryDates.map((dateKey) => (
                <div key={dateKey} className="space-y-2.5 break-inside-avoid">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 bg-slate-100/80 print:bg-slate-100 px-3 py-1.5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{formatDisplayDate(dateKey)}</span>
                    <span className="text-slate-400 font-normal">
                      ({groupedItinerary[dateKey].length} {groupedItinerary[dateKey].length === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  <div className="space-y-2 pl-3 sm:pl-4 border-l-2 border-slate-200 ml-1.5">
                    {groupedItinerary[dateKey].map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 print:bg-white rounded-xl border border-slate-200/80 space-y-1 break-inside-avoid"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          {item.time && (
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {formatTime(item.time)}
                            </span>
                          )}
                        </div>

                        {item.location && (
                          <div className="flex items-center space-x-1 text-xs text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}

                        {item.description && (
                          <p className="text-xs text-slate-600 whitespace-pre-wrap pt-0.5">
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

        {/* 2. Budget & Expenses Section */}
        <section aria-label="Budget and Expenses" className="space-y-4 break-inside-avoid">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Budget & Expenses</h2>
            </div>
            {currency && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {currency}
              </span>
            )}
          </div>

          {/* Over budget banner */}
          {isOverBudget && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-2 break-inside-avoid">
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="font-bold">Over Budget: Total expenses exceed allocated budget</span>
              </div>
              <span className="font-mono font-bold">
                Deficit: {formatCurrency(remainingBudget, currency)}
              </span>
            </div>
          )}

          {/* Budget Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 break-inside-avoid">
            <div className="p-3 bg-slate-50 print:bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Total Budget
              </span>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {hasBudget && totalBudget > 0 ? formatCurrency(totalBudget, currency) : 'No budget set'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 print:bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Total Spent
              </span>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {formatCurrency(totalSpent, currency)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 print:bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Remaining
              </span>
              <div
                className={`text-sm font-bold font-mono ${
                  isOverBudget ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(remainingBudget, currency)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 print:bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Expense Items
              </span>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {budgetSummary?.expenseCount || expenses.length}
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Receipt className="h-3.5 w-3.5 text-slate-500" />
              <span>Recorded Expenses</span>
            </h3>

            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 italic">No expenses recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-2.5 bg-slate-50/50 print:bg-white flex items-center justify-between gap-3 text-xs break-inside-avoid"
                  >
                    <div className="space-y-0.5 truncate flex-grow">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                          {exp.category}
                        </span>
                        <span className="font-semibold text-slate-900 truncate">
                          {exp.description || exp.category}
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
                    <div className="text-right shrink-0 font-mono font-bold text-slate-900">
                      {formatCurrency(exp.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. Packing List Section */}
        <section aria-label="Packing Checklist" className="space-y-4 break-inside-avoid">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Luggage className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Packing List</h2>
            </div>
            {packingSummary && (
              <span className="text-xs font-semibold text-slate-600">
                {packingSummary.packedItems} of {packingSummary.totalItems} Packed ({packingSummary.completionPercentage?.toFixed(0)}%)
              </span>
            )}
          </div>

          {packingItems.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 italic">No packing items.</p>
          ) : (
            <div className="space-y-4">
              {sortedPackingCategories.map((catKey) => {
                const groupList = groupedPacking[catKey] || [];
                return (
                  <div
                    key={catKey}
                    className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid"
                  >
                    <div className="px-3 py-1.5 bg-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
                      <span>{catKey}</span>
                      <span className="text-slate-400 font-normal">
                        {groupList.filter((i) => i.packed).length} / {groupList.length} packed
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 p-2">
                      {groupList.map((item) => (
                        <div
                          key={item.id}
                          className="p-1.5 flex items-center justify-between gap-2 text-xs break-inside-avoid"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {item.packed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            )}
                            <span
                              className={`truncate font-medium ${
                                item.packed ? 'text-slate-500 line-through' : 'text-slate-800'
                              }`}
                            >
                              {item.itemName}
                            </span>
                            {item.quantity > 1 && (
                              <span className="px-1 py-0.2 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
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

        {/* Document Footer */}
        <footer className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 break-inside-avoid">
          <p className="flex items-center justify-center space-x-1.5">
            <Compass className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">Voyago</span>
            <span>— Smart Travel Planning & Itinerary Organizer</span>
          </p>
          <p className="mt-0.5 text-[11px]">
            Generated on {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PrintTripPage;
