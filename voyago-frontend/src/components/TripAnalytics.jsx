import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  CloudSun,
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
  Plane,
  Building,
  Utensils,
  Car,
  Ticket,
  ShoppingBag,
  MoreHorizontal,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { getBudget, getBudgetSummary } from '../services/budgetService';
import { getExpenses } from '../services/expenseService';
import { getItinerary } from '../services/itineraryService';
import { getWeather } from '../services/weatherService';
import { getPlaces } from '../services/placesService';

// Category Styling & Metadata
const CATEGORY_CONFIG = {
  FLIGHT: {
    label: 'Flight & Airfare',
    color: '#0284c7', // Sky-600
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: Plane,
  },
  HOTEL: {
    label: 'Hotel & Lodging',
    color: '#6366f1', // Indigo-500
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Building,
  },
  FOOD: {
    label: 'Food & Dining',
    color: '#f59e0b', // Amber-500
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Utensils,
  },
  TRANSPORT: {
    label: 'Transport & Transit',
    color: '#10b981', // Emerald-500
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: Car,
  },
  ACTIVITY: {
    label: 'Activities & Tours',
    color: '#a855f7', // Purple-500
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Ticket,
  },
  SHOPPING: {
    label: 'Shopping & Gifts',
    color: '#ec4899', // Pink-500
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    icon: ShoppingBag,
  },
  OTHER: {
    label: 'Other Expenses',
    color: '#64748b', // Slate-500
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: MoreHorizontal,
  },
};

const PAYMENT_METHOD_LABELS = {
  CREDIT_CARD: { label: 'Credit Card', icon: CreditCard },
  DEBIT_CARD: { label: 'Debit Card', icon: CreditCard },
  CASH: { label: 'Cash', icon: Banknote },
  UPI: { label: 'UPI / Online', icon: Smartphone },
  NET_BANKING: { label: 'Net Banking', icon: Smartphone },
  OTHER: { label: 'Other Method', icon: CreditCard },
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

// Safe Date Parser (ignoring timezone skew for date-only values)
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

// Format Display Date
const formatDisplayDate = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr || 'N/A';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Custom Chart Tooltip declared outside component to adhere to static-components rule
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-100 flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: data.color }}
          />
          {data.name}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-4 text-slate-300">
          <span className="font-mono font-bold text-white">
            {formatCurrency(data.amount, data.currency || 'INR')}
          </span>
          <span className="text-slate-400 font-medium">({data.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

const TripAnalytics = ({ trip }) => {
  // State for all analytics datasets
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [placesData, setPlacesData] = useState(null);

  // Status & error states per data source
  const [isLoading, setIsLoading] = useState(true);
  const [, setErrorFinancial] = useState('');
  const [errorItinerary, setErrorItinerary] = useState('');
  const [errorWeather, setErrorWeather] = useState('');
  const [errorPlaces, setErrorPlaces] = useState('');

  const tripId = trip?.id;
  const destination = trip?.destination;

  // Load all analytics data with error isolation
  const loadAnalyticsData = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    setErrorFinancial('');
    setErrorItinerary('');
    setErrorWeather('');
    setErrorPlaces('');

    // 1. Financial Data (Budget & Summary & Expenses)
    try {
      const [budgetRes, summaryRes, expensesRes] = await Promise.allSettled([
        getBudget(tripId),
        getBudgetSummary(tripId),
        getExpenses(tripId),
      ]);

      if (budgetRes.status === 'fulfilled') {
        setBudget(budgetRes.value);
      } else {
        setBudget(null);
      }

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      } else {
        setSummary(null);
      }

      if (expensesRes.status === 'fulfilled') {
        setExpenses(Array.isArray(expensesRes.value) ? expensesRes.value : []);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.warn('Financial analytics load error:', err);
      setErrorFinancial('Failed to load financial records');
    }

    // 2. Itinerary Data
    try {
      const items = await getItinerary(tripId);
      setItineraryItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Itinerary analytics load error:', err);
      setErrorItinerary('Itinerary details unavailable');
    }

    // 3. Weather Data
    if (destination) {
      try {
        const weather = await getWeather(destination);
        setWeatherData(weather);
      } catch (err) {
        console.warn('Weather analytics load error:', err);
        setErrorWeather('Weather unavailable');
      }
    }

    // 4. Places Data
    if (destination) {
      try {
        const places = await getPlaces(destination);
        setPlacesData(places);
      } catch (err) {
        console.warn('Places analytics load error:', err);
        setErrorPlaces('Attractions unavailable');
      }
    }

    setIsLoading(false);
  }, [tripId, destination]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Trip Duration Calculation (Inclusive: e.g. Sep 12 - Sep 14 = 3 days)
  const tripDurationDays = useMemo(() => {
    const start = parseLocalDate(trip?.startDate);
    const end = parseLocalDate(trip?.endDate);
    if (!start || !end) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 1;
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
  }, [trip?.startDate, trip?.endDate]);

  // Trip Progress Calculation
  const tripProgress = useMemo(() => {
    const start = parseLocalDate(trip?.startDate);
    const end = parseLocalDate(trip?.endDate);

    if (!start || !end) {
      return {
        status: 'Unknown',
        percentage: 0,
        badgeBg: 'bg-slate-100 text-slate-600',
        progressBarBg: 'bg-slate-300',
        label: 'Dates not set',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startTime = start.getTime();
    // End of end-day (23:59:59.999)
    const endTime = end.getTime() + (24 * 60 * 60 * 1000 - 1);
    const nowTime = today.getTime();

    if (nowTime < startTime) {
      const daysUntil = Math.ceil((startTime - nowTime) / (1000 * 60 * 60 * 24));
      return {
        status: 'Upcoming',
        percentage: 0,
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
        progressBarBg: 'bg-sky-500',
        label: daysUntil === 1 ? 'Starts tomorrow' : `Starts in ${daysUntil} days`,
      };
    } else if (nowTime > endTime) {
      return {
        status: 'Completed',
        percentage: 100,
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        progressBarBg: 'bg-emerald-500',
        label: 'Trip completed',
      };
    } else {
      // In progress
      const totalSpan = Math.max(1, endTime - startTime);
      const elapsed = Math.max(0, nowTime - startTime);
      const percentage = Math.min(100, Math.max(1, Math.round((elapsed / totalSpan) * 100)));
      const currentDay = Math.floor((nowTime - startTime) / (1000 * 60 * 60 * 24)) + 1;

      return {
        status: 'In Progress',
        percentage,
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        progressBarBg: 'bg-amber-500',
        label: `Day ${currentDay} of ${tripDurationDays}`,
      };
    }
  }, [trip?.startDate, trip?.endDate, tripDurationDays]);

  // Financial Metrics Derived from backend summary (Source of Truth)
  const currency = budget?.currency || summary?.currency || 'INR';
  const totalBudget = summary?.totalBudget || 0;
  const totalSpent = summary?.totalSpent || 0;
  const remainingBudget = summary?.remainingBudget ?? (totalBudget - totalSpent);
  const expenseCount = summary?.expenseCount ?? expenses.length;
  const isOverBudget = remainingBudget < 0;

  // Budget Utilization Ratio & Percentage
  const budgetUtilization = useMemo(() => {
    if (!totalBudget || totalBudget <= 0) {
      return {
        percentage: totalSpent > 0 ? 100 : 0,
        display: totalSpent > 0 ? '> 100%' : '0%',
        barWidth: totalSpent > 0 ? 100 : 0,
        isOver: totalSpent > 0,
      };
    }
    const rawPct = (totalSpent / totalBudget) * 100;
    return {
      percentage: rawPct,
      display: `${rawPct.toFixed(1)}%`,
      barWidth: Math.min(100, Math.max(0, rawPct)),
      isOver: rawPct > 100,
    };
  }, [totalBudget, totalSpent]);

  // Category Distribution for Recharts
  const categoryChartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const groupMap = {};
    let total = 0;

    expenses.forEach((item) => {
      const cat = (item.category || 'OTHER').toUpperCase();
      const amt = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;
      groupMap[cat] = (groupMap[cat] || 0) + amt;
      total += amt;
    });

    return Object.entries(groupMap)
      .map(([categoryKey, amount]) => {
        const config = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.OTHER;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return {
          name: config.label,
          categoryKey,
          amount,
          currency,
          percentage: Number(percentage.toFixed(1)),
          color: config.color,
          bg: config.bg,
          text: config.text,
          border: config.border,
          Icon: config.icon,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, currency]);

  // Recent Expenses (Up to 5)
  const recentExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    return [...expenses]
      .sort((a, b) => {
        const dateA = new Date(a.expenseDate || 0).getTime();
        const dateB = new Date(b.expenseDate || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [expenses]);

  // Itinerary Breakdown (Today, Upcoming, Completed)
  const itineraryStats = useMemo(() => {
    const total = itineraryItems.length;
    if (total === 0) {
      return { total: 0, today: 0, upcoming: 0, past: 0 };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    let upcomingCount = 0;
    let pastCount = 0;

    itineraryItems.forEach((item) => {
      if (!item.date) {
        upcomingCount++;
        return;
      }
      if (item.date === todayStr) {
        todayCount++;
      } else if (item.date > todayStr) {
        upcomingCount++;
      } else {
        pastCount++;
      }
    });

    return { total, today: todayCount, upcoming: upcomingCount, past: pastCount };
  }, [itineraryItems]);

  // Notable Attractions Sample
  const placesCount = placesData?.places?.length || 0;
  const notablePlaces = useMemo(() => {
    if (!placesData?.places || !Array.isArray(placesData.places)) return [];
    return placesData.places.slice(0, 3);
  }, [placesData]);

  // Scroll to budget section helper
  const handleScrollToBudget = () => {
    const element = document.getElementById('trip-budget-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-label="Trip Analytics & Overview"
      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8"
    >
      {/* 1. Header & Live Trip Progress */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-sm">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Trip Overview & Analytics
              </h2>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${tripProgress.badgeBg}`}
              >
                {tripProgress.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Live intelligence, budget utilization, activity roadmap, and destination highlights
            </p>
          </div>
        </div>

        {/* Action / Refresh */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Trip Key Highlights Banner (Duration, Dates, Progress Bar) */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-5 sm:p-6 border border-slate-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {/* Destination */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span>Destination</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {destination || 'Not Specified'}
            </p>
          </div>

          {/* Trip Duration */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              <span>Trip Duration</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900">
              {tripDurationDays} {tripDurationDays === 1 ? 'Day' : 'Days'}
            </p>
          </div>

          {/* Travel Dates */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Dates</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              {formatDisplayDate(trip?.startDate)} – {formatDisplayDate(trip?.endDate)}
            </p>
          </div>

          {/* Schedule Status */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Timeline Status</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {tripProgress.label}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-3 border-t border-slate-200/70">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Trip Progress</span>
            <span className="font-bold text-slate-900">{tripProgress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${tripProgress.progressBarBg}`}
              style={{ width: `${tripProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Financial Summary Metric Cards (4 Columns) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <span>Financial Snapshot</span>
          </h3>
          {budget && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currency} Currency
            </span>
          )}
        </div>

        {/* Over-Budget Alert Callout */}
        {isOverBudget && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 animate-fadeIn">
            <div className="flex items-start sm:items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-bold">Budget Exceeded Warning</p>
                <p className="text-xs text-rose-600">
                  Total expenditures exceed planned budget by{' '}
                  <span className="font-semibold font-mono">
                    {formatCurrency(Math.abs(remainingBudget), currency)}
                  </span>
                  .
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-900 self-start sm:self-auto">
              Deficit: {formatCurrency(remainingBudget, currency)}
            </span>
          </div>
        )}

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Budget Card */}
          <div className="bg-slate-50/80 hover:bg-white rounded-2xl p-4.5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Budget</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono truncate">
                {budget ? formatCurrency(totalBudget, currency) : 'No Budget Set'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {budget ? 'Target travel allowance' : 'Unallocated budget'}
              </p>
            </div>
          </div>

          {/* Total Spent Card */}
          <div className="bg-slate-50/80 hover:bg-white rounded-2xl p-4.5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono truncate">
                {formatCurrency(totalSpent, currency)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Across {expenseCount} recorded {expenseCount === 1 ? 'expense' : 'expenses'}
              </p>
            </div>
          </div>

          {/* Remaining Balance Card */}
          <div
            className={`rounded-2xl p-4.5 border transition-all flex flex-col justify-between ${
              isOverBudget
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-slate-50/80 hover:bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Remaining Balance</span>
              <div
                className={`p-2 rounded-xl ${
                  isOverBudget ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {isOverBudget ? <AlertCircle className="h-4 w-4" /> : <TrendingDown className="h-4 w-4 text-emerald-600" />}
              </div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-extrabold font-mono truncate ${
                  isOverBudget ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(remainingBudget, currency)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isOverBudget ? 'Over allocated budget' : 'Remaining allowance'}
              </p>
            </div>
          </div>

          {/* Total Expenses Count Card */}
          <div className="bg-slate-50/80 hover:bg-white rounded-2xl p-4.5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
                {expenseCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Logged transactions</p>
            </div>
          </div>
        </div>

        {/* Budget Utilization Meter */}
        {budget && totalBudget > 0 && (
          <div className="bg-slate-50/70 rounded-2xl p-4.5 sm:p-5 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center space-x-1.5">
                <span className="text-slate-500">Budget Utilization:</span>
                <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                  {budgetUtilization.display}
                </span>
                {isOverBudget && (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                    Over Budget
                  </span>
                )}
              </span>
              <span className="text-slate-500 font-mono text-xs">
                {formatCurrency(totalSpent, currency)} / {formatCurrency(totalBudget, currency)}
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget
                    ? 'bg-rose-500'
                    : budgetUtilization.percentage > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetUtilization.barWidth}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Analytics Breakdown Section (Charts & Recent Expenses Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expense Category Distribution (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Layers className="h-4 w-4" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  Expense Category Breakdown
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {categoryChartData.length} {categoryChartData.length === 1 ? 'Category' : 'Categories'}
              </span>
            </div>

            {/* If No Expenses: Clean Empty State */}
            {categoryChartData.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">No expenses recorded yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                  Add trip expenses to see real-time distribution charts across flights, hotels, food, and activities.
                </p>
                <button
                  onClick={handleScrollToBudget}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <span>Go to Budget & Expenses</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Recharts Donut / Pie Chart */}
                <div className="sm:col-span-6 h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {categoryChartData.map((entry) => (
                          <Cell key={`cell-${entry.categoryKey}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Categories Legend Badges */}
                <div className="sm:col-span-6 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categoryChartData.map((item) => {
                    const { Icon } = item;
                    return (
                      <div
                        key={item.categoryKey}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className="p-1 rounded-md text-white shrink-0"
                            style={{ backgroundColor: item.color }}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                          <span className="font-semibold text-slate-800 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="font-bold font-mono text-slate-900">
                            {formatCurrency(item.amount, currency)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total categorized spending:</span>
            <span className="font-bold font-mono text-slate-900">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
        </div>

        {/* Recent Expenses List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Receipt className="h-4 w-4" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">Recent Expenses</h4>
              </div>
              {expenses.length > 5 && (
                <button
                  onClick={handleScrollToBudget}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All ({expenses.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {recentExpenses.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400">No expenses logged for this trip yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentExpenses.map((exp) => {
                  const cat = (exp.category || 'OTHER').toUpperCase();
                  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.OTHER;
                  const payment = PAYMENT_METHOD_LABELS[exp.paymentMethod] || {
                    label: exp.paymentMethod || 'Card',
                  };
                  return (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 transition-colors border border-slate-100 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 truncate flex-grow">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}
                          >
                            {exp.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {exp.description || config.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span>{formatDisplayDate(exp.expenseDate)}</span>
                          <span>•</span>
                          <span>{payment.label}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {formatCurrency(exp.amount, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100">
            <button
              onClick={handleScrollToBudget}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Manage Budget & Detailed Expenses</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Destination & Activity Insights (Itinerary, Places & Weather Highlights) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Itinerary Summary Card */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Itinerary Roadmap</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Calendar className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 mb-2">
              {itineraryStats.total}{' '}
              <span className="text-xs font-normal text-slate-500">Total Planned</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Activities Today:</span>
                <span className="font-bold text-slate-800">{itineraryStats.today}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Upcoming:</span>
                <span className="font-bold text-slate-800">{itineraryStats.upcoming}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Past / Completed:</span>
                <span className="font-bold text-slate-800">{itineraryStats.past}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
            {errorItinerary ? errorItinerary : 'Planned chronologically'}
          </div>
        </div>

        {/* Places & Attractions Summary Card */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Attractions</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Compass className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 mb-2">
              {placesCount}{' '}
              <span className="text-xs font-normal text-slate-500">
                {placesCount === 1 ? 'Attraction' : 'Attractions'}
              </span>
            </div>

            {errorPlaces ? (
              <p className="text-xs text-amber-600">{errorPlaces}</p>
            ) : notablePlaces.length > 0 ? (
              <div className="space-y-1 text-xs text-slate-700">
                <p className="text-[11px] font-semibold text-slate-400 mb-1">Top Discoveries:</p>
                {notablePlaces.map((place, idx) => (
                  <p key={place.id || idx} className="truncate text-slate-700">
                    • {place.name || place.title || 'Attraction'}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Discover sights in {destination || 'destination'}.</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400 truncate">
            Destination: {destination || 'N/A'}
          </div>
        </div>

        {/* Destination Weather Summary Card */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Weather Snapshot</span>
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <CloudSun className="h-4 w-4" />
              </div>
            </div>

            {errorWeather ? (
              <div>
                <p className="text-sm font-semibold text-slate-700">Weather data unavailable</p>
                <p className="text-xs text-slate-400 mt-1">Check internet connection or location name.</p>
              </div>
            ) : weatherData?.current ? (
              <div>
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {Math.round(weatherData.current.temperature ?? weatherData.current.temp ?? 0)}°C
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {weatherData.current.condition || weatherData.current.weather || 'Clear'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {weatherData.location?.name || destination}
                  {weatherData.location?.country ? `, ${weatherData.location.country}` : ''}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-600">Forecast syncing...</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
            Real-time conditions
          </div>
        </div>
      </div>
    </section>
  );
};

export default TripAnalytics;
