import React from 'react';
import Button from './Button';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const DeleteExpenseModal = ({
  isOpen,
  onClose,
  onConfirm,
  expense = null,
  currency = 'INR',
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
            <h3 className="text-xl font-bold text-slate-900">Delete Expense?</h3>
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

        {/* Expense Snapshot */}
        <div className="space-y-3 mb-6 text-sm text-slate-600">
          <p>Are you sure you want to delete this recorded expense?</p>
          {expense && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>{expense.category}</span>
                <span className="text-rose-600">
                  {typeof expense.amount === 'number' ? expense.amount.toLocaleString() : expense.amount} {currency}
                </span>
              </div>
              {expense.description && (
                <p className="text-xs text-slate-500 truncate">{expense.description}</p>
              )}
              {expense.expenseDate && (
                <p className="text-[11px] text-slate-400">Date: {expense.expenseDate}</p>
              )}
            </div>
          )}
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
            <span>Delete Expense</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteExpenseModal;
