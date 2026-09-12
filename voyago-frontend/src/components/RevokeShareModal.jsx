import React, { useEffect } from 'react';
import Button from './Button';
import { AlertTriangle, X, Loader2, Link2Off } from 'lucide-react';

const RevokeShareModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  error = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-share-title"
    >
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="p-2 bg-rose-50 rounded-xl">
              <Link2Off className="h-6 w-6 text-rose-600" />
            </div>
            <h3 id="revoke-share-title" className="text-xl font-bold text-slate-900">Revoke Share Link?</h3>
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

        {/* Description */}
        <div className="space-y-3 mb-6 text-sm text-slate-600">
          <p>
            Are you sure you want to revoke this share link?
          </p>
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Anyone using this link will no longer be able to view the shared trip. You can create a new share link at any time.
            </span>
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
            <span>Revoke Link</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RevokeShareModal;
