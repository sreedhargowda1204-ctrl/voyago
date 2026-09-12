import React from 'react';
import Button from './Button';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const DeleteBudgetModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  error = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="p-2 bg-rose-50 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Delete Trip Budget?</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Confirmation Message */}
        <div className="space-y-3 mb-6 text-sm text-slate-600 leading-relaxed">
          <p>
            Are you sure you want to remove the allocated budget for this trip?
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-500">
            <strong>Note:</strong> Removing the budget will reset the budget target to unset, but your recorded expenses will remain intact.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
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
            className="bg-rose-600 hover:bg-rose-700 text-white flex items-center space-x-2 px-5 cursor-pointer shadow-sm"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Delete Budget</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBudgetModal;
