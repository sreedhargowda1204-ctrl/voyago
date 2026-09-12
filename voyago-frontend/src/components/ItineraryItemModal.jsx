import React, { useState } from 'react';
import Button from './Button';
import { X, Calendar, Clock, MapPin, Type, AlignLeft, AlertCircle, Loader2 } from 'lucide-react';

const ItineraryItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
  serverError = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <ItineraryItemModalContent
        key={initialData?.id || 'new-item'}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        isLoading={isLoading}
        serverError={serverError}
      />
    </div>
  );
};

const ItineraryItemModalContent = ({
  onClose,
  onSubmit,
  initialData,
  isLoading,
  serverError,
}) => {
  const [formData, setFormData] = useState(() => ({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || '',
    time: initialData?.time ? initialData.time.substring(0, 5) : '',
    location: initialData?.location || '',
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
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

    const payload = {
      title: formData.title.trim(),
      description: formData.description ? formData.description.trim() : null,
      date: formData.date,
      time: formData.time ? formData.time : null,
      location: formData.location ? formData.location.trim() : null,
    };

    onSubmit(payload);
  };

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {isEditMode ? 'Edit Activity' : 'Add Activity / Itinerary Item'}
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
          <label htmlFor="item-title" className="block text-sm font-medium text-slate-700 mb-1">
            Activity Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Type className="h-4 w-4" />
            </div>
            <input
              type="text"
              id="item-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Visit Museum / Dinner at Le Bistro"
              disabled={isLoading}
              className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                errors.title ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
              } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2`}
            />
          </div>
          {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="item-date" className="block text-sm font-medium text-slate-700 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                id="item-date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                  errors.date ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.date && <p className="mt-1 text-xs text-rose-600">{errors.date}</p>}
          </div>

          <div>
            <label htmlFor="item-time" className="block text-sm font-medium text-slate-700 mb-1">
              Time <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Clock className="h-4 w-4" />
              </div>
              <input
                type="time"
                id="item-time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 focus:ring-blue-500 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="item-location" className="block text-sm font-medium text-slate-700 mb-1">
            Location <span className="text-xs text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="h-4 w-4" />
            </div>
            <input
              type="text"
              id="item-location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Louvre Museum, Paris"
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 focus:ring-blue-500 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="item-description" className="block text-sm font-medium text-slate-700 mb-1">
            Description & Notes <span className="text-xs text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
              <AlignLeft className="h-4 w-4" />
            </div>
            <textarea
              id="item-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Add booking reference, meeting point, or activity details..."
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
            <span>{isEditMode ? 'Update Activity' : 'Save Activity'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ItineraryItemModal;
