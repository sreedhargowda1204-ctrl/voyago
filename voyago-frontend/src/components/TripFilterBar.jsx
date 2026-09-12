import React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Clock,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';
import { TRIP_STATUS, SORT_OPTIONS, DEFAULT_SORT } from '../utils/tripFilterUtils';

const STATUS_TABS = [
  { value: TRIP_STATUS.ALL, label: 'All Trips', icon: ListFilter },
  { value: TRIP_STATUS.UPCOMING, label: 'Upcoming', icon: Calendar },
  { value: TRIP_STATUS.ONGOING, label: 'Ongoing', icon: Clock },
  { value: TRIP_STATUS.COMPLETED, label: 'Completed', icon: CheckCircle2 },
];

const TripFilterBar = ({
  searchTerm = '',
  onSearchChange,
  statusFilter = TRIP_STATUS.ALL,
  onStatusChange,
  sortBy = DEFAULT_SORT,
  onSortChange,
  onClearFilters,
  totalTripsCount = 0,
  filteredTripsCount = 0,
}) => {
  const isFiltered =
    searchTerm.trim() !== '' ||
    statusFilter !== TRIP_STATUS.ALL ||
    sortBy !== DEFAULT_SORT;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
      {/* Top Row: Search Input & Sort Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search trips by title or destination..."
            aria-label="Search trips by title or destination"
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2 shrink-0">
          <label
            htmlFor="trip-sort-select"
            className="text-xs font-semibold text-slate-500 flex items-center space-x-1 shrink-0 hidden sm:flex"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span>Sort by:</span>
          </label>
          <select
            id="trip-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort trips"
            className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all shadow-2xs"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Row: Status Filter Tabs & Summary / Clear action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
        {/* Status Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter trips by status"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl"
        >
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            const Icon = tab.icon;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onStatusChange(tab.value)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Result Indicator & Clear Button */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs">
          <span className="text-slate-500 font-medium">
            {isFiltered
              ? `Showing ${filteredTripsCount} of ${totalTripsCount} ${
                  totalTripsCount === 1 ? 'trip' : 'trips'
                }`
              : `${totalTripsCount} ${totalTripsCount === 1 ? 'trip' : 'trips'}`}
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              aria-label="Clear all applied filters and search"
              className="inline-flex items-center space-x-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripFilterBar;
