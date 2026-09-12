import React, { useState } from 'react';
import Button from './Button';
import { X, Calendar, MapPin, Type, FileText, AlertCircle, Loader2 } from 'lucide-react';

const TripModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false, serverError = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <TripModalContent
        key={initialData?.id || 'new'}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        isLoading={isLoading}
        serverError={serverError}
      />
    </div>
  );
};

const TripModalContent = ({ onClose, onSubmit, initialData, isLoading, serverError }) => {
  const [formData, setFormData] = useState(() => ({
    title: initialData?.title || '',
    destination: initialData?.destination || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    notes: initialData?.notes || '',
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      if (formData.endDate < formData.startDate) {
        newErrors.endDate = 'End date cannot be before start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: formData.title.trim(),
      destination: formData.destination.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      notes: formData.notes ? formData.notes.trim() : '',
    });
  };

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {isEditMode ? 'Edit Trip' : 'Create New Trip'}
        </h3>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
            Trip Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Type className="h-4 w-4" />
            </div>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Summer Vacation in Italy"
              disabled={isLoading}
              className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                errors.title ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
              } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2`}
            />
          </div>
          {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
        </div>

        {/* Destination */}
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">
            Destination <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="h-4 w-4" />
            </div>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g. Rome, Italy"
              disabled={isLoading}
              className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                errors.destination ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
              } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2`}
            />
          </div>
          {errors.destination && <p className="mt-1 text-xs text-rose-600">{errors.destination}</p>}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                  errors.startDate ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.startDate && <p className="mt-1 text-xs text-rose-600">{errors.startDate}</p>}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">
              End Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                  errors.endDate ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.endDate && <p className="mt-1 text-xs text-rose-600">{errors.endDate}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            Notes & Itinerary Details <span className="text-xs text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add hotel info, packing reminders, or places you want to visit..."
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 focus:ring-blue-500 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 cursor-pointer"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isEditMode ? 'Update Trip' : 'Create Trip'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TripModal;
