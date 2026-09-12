import React from 'react';
import Button from './Button';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const DeleteTripModal = ({ isOpen, onClose, onConfirm, trip, isLoading = false, error = '' }) => {
  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-100">
        <div className="flex items-start space-x-4">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Delete Trip</h3>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">"{trip.title}"</span>? This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-3">
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
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white flex items-center space-x-2 cursor-pointer"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTripModal;
