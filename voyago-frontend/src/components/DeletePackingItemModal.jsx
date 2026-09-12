import React from 'react';
import Button from './Button';
import { AlertTriangle, X, Loader2, Package } from 'lucide-react';

const DeletePackingItemModal = ({
  isOpen,
  onClose,
  onConfirm,
  item = null,
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
            <h3 className="text-xl font-bold text-slate-900">Delete Packing Item?</h3>
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

        {/* Item Snapshot */}
        <div className="space-y-3 mb-6 text-sm text-slate-600">
          <p>Are you sure you want to remove this item from your packing list?</p>
          {item && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center space-x-1.5 truncate">
                  <Package className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{item.itemName}</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold shrink-0">
                  Qty: {item.quantity}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>Category: {item.category}</span>
                {item.packed && (
                  <span className="text-emerald-600 font-medium">• Already Packed</span>
                )}
              </div>
              {item.notes && (
                <p className="text-xs text-slate-500 truncate mt-1">Note: {item.notes}</p>
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
            <span>Delete Item</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeletePackingItemModal;
