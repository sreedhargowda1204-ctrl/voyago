import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import Loading from './Loading';
import RevokeShareModal from './RevokeShareModal';
import {
  getShare,
  createShare,
  revokeShare,
} from '../services/shareService';
import {
  Share2,
  Lock,
  Globe,
  Copy,
  Check,
  Link2Off,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';

const TripShareSection = ({ tripId }) => {
  const [shareData, setShareData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Revoke Modal State
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');

  // Fetch current share status
  const fetchShareStatus = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await getShare(tripId);
      setShareData(data?.active ? data : null);
    } catch (err) {
      if (err.response?.status === 404) {
        // 404 is the expected state when no active share exists
        setShareData(null);
      } else {
        console.error('Failed to load share status:', err);
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.message === 'Network Error' || !err.response) {
          setError('Unable to reach share service. Please check connection.');
        } else {
          setError('Failed to load share status.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchShareStatus();
  }, [fetchShareStatus]);

  // Create or Get Share Link
  const handleCreateShare = async () => {
    setIsCreating(true);
    setError('');

    try {
      const data = await createShare(tripId);
      setShareData(data);
    } catch (err) {
      console.error('Failed to create share link:', err);
      setError(err.response?.data?.message || 'Failed to generate share link. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy Share Link to Clipboard
  const handleCopyLink = async () => {
    if (!shareData?.shareUrl) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.shareUrl);
      } else {
        // Fallback for older browsers
        const tempInput = document.createElement('textarea');
        tempInput.value = shareData.shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  // Open Revoke Modal
  const handleOpenRevokeModal = () => {
    setRevokeError('');
    setIsRevokeModalOpen(true);
  };

  const handleCloseRevokeModal = () => {
    if (!isRevoking) {
      setIsRevokeModalOpen(false);
      setRevokeError('');
    }
  };

  // Confirm Revoke Link
  const handleConfirmRevoke = async () => {
    setIsRevoking(true);
    setRevokeError('');

    try {
      await revokeShare(tripId);
      setShareData(null);
      setIsRevokeModalOpen(false);
    } catch (err) {
      console.error('Failed to revoke share link:', err);
      setRevokeError(err.response?.data?.message || 'Failed to revoke share link. Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3.5 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs">
            <Share2 className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Share Trip</h2>
            <p className="text-sm text-slate-500">Checking share status...</p>
          </div>
        </div>
        <div className="py-8 flex justify-center">
          <Loading />
        </div>
      </section>
    );
  }

  // Error State (Network or server fault)
  if (error && !shareData) {
    return (
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3.5 mb-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl shadow-xs">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Share Trip</h2>
            <p className="text-sm text-slate-500">Create a read-only link to share this trip with others</p>
          </div>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Unable to load share status</h3>
          <p className="text-sm text-rose-600 max-w-md mx-auto mb-4">{error}</p>
          <Button
            onClick={fetchShareStatus}
            variant="outline"
            className="inline-flex items-center space-x-2 border-rose-300 text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      </section>
    );
  }

  const isShared = Boolean(shareData?.active && shareData?.shareUrl);

  return (
    <section
      aria-label="Trip Sharing"
      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-2.5 rounded-2xl shadow-xs ${
              isShared ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {isShared ? <Globe className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Share Trip</h2>
              {isShared ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Globe className="h-3 w-3 mr-1" />
                  Trip sharing is enabled
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  <Lock className="h-3 w-3 mr-1" />
                  Trip is private
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Create a read-only link to share this trip with friends, family, or travel companions
            </p>
          </div>
        </div>

        {/* Action button if private */}
        {!isShared && (
          <Button
            onClick={handleCreateShare}
            disabled={isCreating}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 shadow-sm cursor-pointer shrink-0"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span>{isCreating ? 'Generating...' : 'Create Share Link'}</span>
          </Button>
        )}
      </div>

      {/* State A: Trip is Private */}
      {!isShared && (
        <div className="bg-slate-50/70 rounded-2xl p-6 sm:p-8 border border-slate-100 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h4 className="text-base font-bold text-slate-900 flex items-center justify-center sm:justify-start space-x-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Share your travel itinerary securely</span>
            </h4>
            <p className="text-sm text-slate-600">
              Anyone with the link can view your itinerary, budget summary, expenses, and packing list in read-only mode without logging in. Your private account details and edit rights remain completely secure.
            </p>
          </div>

          <Button
            onClick={handleCreateShare}
            disabled={isCreating}
            className="shrink-0 px-6 py-2.5 cursor-pointer shadow-sm"
          >
            {isCreating ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Link...</span>
              </span>
            ) : (
              <span>Create Share Link</span>
            )}
          </Button>
        </div>
      )}

      {/* State B: Trip is Shared */}
      {isShared && (
        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl p-5 sm:p-6 border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                <span>Public Read-Only Link</span>
              </h4>
              <p className="text-xs text-slate-500">
                Anyone with this link can view the trip without having a Voyago account.
              </p>
            </div>

            <span className="text-[11px] text-slate-400 font-mono self-start sm:self-auto">
              Active link
            </span>
          </div>

          {/* Share Link Input & Copy Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-grow">
              <input
                type="text"
                readOnly
                value={shareData.shareUrl}
                aria-label="Public Share URL"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 select-all"
                onClick={(e) => e.target.select()}
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs sm:text-sm cursor-pointer shadow-xs transition-all ${
                  copied
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                aria-label="Copy share link to clipboard"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </Button>

              <a
                href={shareData.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs flex items-center justify-center"
                title="Open public view in new tab"
                aria-label="Open public view in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>

              <Button
                type="button"
                variant="outline"
                onClick={handleOpenRevokeModal}
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 text-xs sm:text-sm border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer shadow-xs"
                aria-label="Revoke share link"
              >
                <Link2Off className="h-4 w-4" />
                <span>Revoke</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      <RevokeShareModal
        isOpen={isRevokeModalOpen}
        onClose={handleCloseRevokeModal}
        onConfirm={handleConfirmRevoke}
        isLoading={isRevoking}
        error={revokeError}
      />
    </section>
  );
};

export default TripShareSection;
