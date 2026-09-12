import React, { useState, useEffect } from 'react';
import { getPlaces } from '../services/placesService';
import Button from './Button';
import {
  Landmark,
  Star,
  MapPin,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Compass,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';

// Category badge color helper
const getCategoryStyle = (category) => {
  switch (category?.toLowerCase()) {
    case 'museum':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'landmark':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'historical site':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'park & nature':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'cultural attraction':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

// Place Card Component
const PlaceCard = ({ place }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasImage = place.imageUrl && !imageFailed;
  const hasRating = typeof place.rating === 'number' && !isNaN(place.rating);
  const isLongDescription = place.description && place.description.length > 180;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Card Image or Placeholder */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          {hasImage ? (
            <img
              src={place.imageUrl}
              alt={place.name}
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-4 text-center">
              <ImageIcon className="h-10 w-10 text-slate-300 mb-1" />
              <span className="text-xs font-medium text-slate-400">Photo Unavailable</span>
            </div>
          )}

          {/* Category Badge overlay on image top-left */}
          {place.category && (
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-xs border ${getCategoryStyle(
                  place.category
                )}`}
              >
                {place.category}
              </span>
            </div>
          )}

          {/* Rating Badge overlay on image top-right */}
          {hasRating && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/95 text-slate-800 backdrop-blur-md shadow-xs border border-slate-100">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>{place.rating.toFixed(1)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5">
          <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {place.name}
          </h4>

          {/* Address */}
          {place.address && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{place.address}</span>
            </div>
          )}

          {/* Description */}
          {place.description ? (
            <div>
              <p
                className={`text-xs text-slate-600 leading-relaxed ${
                  !isExpanded && isLongDescription ? 'line-clamp-3' : ''
                }`}
              >
                {place.description}
              </p>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No description available.</p>
          )}
        </div>
      </div>

      {/* Card Footer / Action Button */}
      {place.websiteUrl && (
        <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 mt-2">
          <a
            href={place.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center space-x-1.5 w-full px-3 py-2 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 hover:text-blue-800 rounded-xl border border-blue-200 shadow-2xs transition-all cursor-pointer"
          >
            <span>Visit Website</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};

// Skeleton Placeholder Cards for Loading State
const PlacesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((idx) => (
      <div
        key={idx}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="h-48 bg-slate-200 w-full" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-slate-200 rounded-md w-3/4" />
            <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3 bg-slate-100 rounded-md w-full" />
              <div className="h-3 bg-slate-100 rounded-md w-5/6" />
              <div className="h-3 bg-slate-100 rounded-md w-2/3" />
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="h-8 bg-slate-200 rounded-xl w-full" />
        </div>
      </div>
    ))}
  </div>
);

const PlacesSection = ({ destination }) => {
  const [placesData, setPlacesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlacesData() {
      if (!destination || !destination.trim()) {
        if (isMounted) {
          setPlacesData(null);
          setIsLoading(false);
          setError('');
        }
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const data = await getPlaces(destination);
        if (isMounted) {
          setPlacesData(data);
          setError('');
        }
      } catch (err) {
        console.error('Failed to load places for destination:', destination, err);
        if (isMounted) {
          if (err.response?.status === 404) {
            setError(`Could not find attractions for "${destination}".`);
          } else if (err.response?.data?.message) {
            setError(err.response.data.message);
          } else if (err.message === 'Network Error' || !err.response) {
            setError('Unable to connect to places service. Please check server status.');
          } else {
            setError('Unable to load places for this destination.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPlacesData();

    return () => {
      isMounted = false;
    };
  }, [destination, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (!destination || !destination.trim()) {
    return null;
  }

  const places = placesData?.places || [];
  const placeCount = places.length;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-100 overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Landmark className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Places & Attractions</h3>
            <p className="text-xs text-slate-500">
              Discover popular places to visit in {destination}
            </p>
          </div>
        </div>

        {!isLoading && !error && placeCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 self-start sm:self-auto">
            {placeCount} {placeCount === 1 ? 'place' : 'places'} to explore
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && <PlacesSkeleton />}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-rose-900 mb-1">
            Unable to load places for this destination
          </h4>
          <p className="text-xs text-rose-700 max-w-md mx-auto mb-4">{error}</p>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="inline-flex items-center space-x-2 text-rose-700 border-rose-300 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && placeCount === 0 && (
        <div className="py-12 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Compass className="h-10 w-10 text-slate-400 mx-auto mb-2.5" />
          <h4 className="text-base font-bold text-slate-800 mb-1">No attractions found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No attractions were found for this destination.
          </p>
        </div>
      )}

      {/* Places Grid */}
      {!isLoading && !error && placeCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place, idx) => (
            <PlaceCard key={`${place.name}-${idx}`} place={place} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacesSection;
