import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getMapLocation, getMapPlaces, getRoute } from '../services/mapsService';
import Button from './Button';
import Loading from './Loading';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Compass,
  Star,
  AlertCircle,
  RefreshCw,
  X,
  Car,
} from 'lucide-react';

// Custom SVG Leaflet Icons for clean rendering without asset path dependencies
const createCustomIcon = (color, isSelected = false) => {
  const size = isSelected ? 42 : 34;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    html: `<div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform duration-150">
             ${svg}
             ${isSelected ? '<span class="absolute -top-1 -right-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>' : ''}
           </div>`,
    className: 'custom-map-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
};

const destinationIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
           <span class="animate-ping absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-400 opacity-75"></span>
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="44" height="44" style="filter: drop-shadow(0 6px 10px rgba(79, 70, 229, 0.45));">
             <path fill="#4f46e5" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
             <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
           </svg>
         </div>`,
  className: 'destination-map-marker',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -42],
});

// Map Viewport Controller to programmatic pan/zoom/fit
const MapViewController = ({ center, zoom, selectedPosition, routeGeometry, fitRouteTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (center && !selectedPosition && (!routeGeometry || routeGeometry.length === 0)) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map, selectedPosition, routeGeometry]);

  useEffect(() => {
    if (selectedPosition) {
      map.flyTo(selectedPosition, 15, { duration: 1.2 });
    }
  }, [selectedPosition, map]);

  useEffect(() => {
    if (routeGeometry && routeGeometry.length > 0) {
      const bounds = L.latLngBounds(routeGeometry.map((pt) => [pt.latitude, pt.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, [routeGeometry, fitRouteTrigger, map]);

  return null;
};

const MapSection = ({ destination }) => {
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected place for focusing on map
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Active calculated route state
  const [activeRoute, setActiveRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [fitRouteTrigger, setFitRouteTrigger] = useState(0);

  // References to open popup programmatically
  const markerRefs = useRef({});

  // Fetch Destination Coordinates and Places
  const fetchMapData = useCallback(async () => {
    if (!destination || !destination.trim()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setActiveRoute(null);
    setRouteError('');
    setSelectedPlace(null);
    setSelectedPosition(null);

    try {
      // 1. Fetch destination location coordinates
      const locResponse = await getMapLocation(destination.trim());
      if (!locResponse || !locResponse.location) {
        throw new Error('Could not resolve destination coordinates.');
      }
      setDestinationLocation(locResponse.location);

      // 2. Fetch up to 15 places with coordinates
      try {
        const placesResponse = await getMapPlaces(destination.trim());
        if (placesResponse && Array.isArray(placesResponse.places)) {
          // Filter places with valid numeric coordinates
          const validPlaces = placesResponse.places.filter(
            (p) =>
              typeof p.latitude === 'number' &&
              typeof p.longitude === 'number' &&
              !isNaN(p.latitude) &&
              !isNaN(p.longitude)
          );
          setPlaces(validPlaces);
        } else {
          setPlaces([]);
        }
      } catch (placeErr) {
        console.warn('Places lookup failed, falling back to destination marker only:', placeErr);
        setPlaces([]);
      }
    } catch (err) {
      console.error('Map data load error:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load map information.');
    } finally {
      setIsLoading(false);
    }
  }, [destination]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Handle "Show on Map" click from place list
  const handleShowOnMap = (place) => {
    if (!place || typeof place.latitude !== 'number' || typeof place.longitude !== 'number') return;

    setSelectedPlace(place);
    setSelectedPosition([place.latitude, place.longitude]);

    // Open marker popup if available
    const markerKey = `${place.name}_${place.latitude}_${place.longitude}`;
    if (markerRefs.current[markerKey]) {
      markerRefs.current[markerKey].openPopup();
    }
  };

  // Handle "Route from Destination"
  const handleCalculateRoute = async (targetPlace) => {
    if (!destinationLocation || !targetPlace) return;
    if (isCalculatingRoute) return;

    setIsCalculatingRoute(true);
    setRouteError('');
    setSelectedPlace(targetPlace);
    setSelectedPosition(null); // Allow route bounds to take precedence

    try {
      const routeData = await getRoute(
        destinationLocation.latitude,
        destinationLocation.longitude,
        targetPlace.latitude,
        targetPlace.longitude
      );

      setActiveRoute({
        ...routeData,
        destinationName: destinationLocation.name,
        placeName: targetPlace.name,
      });
      setFitRouteTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Route calculation error:', err);
      setRouteError(err.response?.data?.message || err.message || 'Unable to calculate route.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Clear active route
  const handleClearRoute = () => {
    setActiveRoute(null);
    setRouteError('');
    if (destinationLocation) {
      setSelectedPosition([destinationLocation.latitude, destinationLocation.longitude]);
    }
  };

  // Recenter map on Destination
  const handleRecenterDestination = () => {
    if (destinationLocation) {
      setSelectedPlace(null);
      setSelectedPosition([destinationLocation.latitude, destinationLocation.longitude]);
    }
  };

  // Polyline coordinates array for Leaflet: [[lat, lng], [lat, lng], ...]
  const polylinePositions = useMemo(() => {
    if (!activeRoute || !Array.isArray(activeRoute.geometry)) return [];
    return activeRoute.geometry
      .filter((pt) => typeof pt.latitude === 'number' && typeof pt.longitude === 'number')
      .map((pt) => [pt.latitude, pt.longitude]);
  }, [activeRoute]);

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Compass className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Interactive Map & Routes</h2>
            <p className="text-sm text-slate-500">Loading destination coordinates and attractions...</p>
          </div>
        </div>
        <div className="h-96 w-full rounded-2xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse flex flex-col items-center justify-center text-slate-400">
          <Loading />
          <p className="mt-3 text-sm font-medium text-slate-500">Preparing Map for {destination}...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !destinationLocation) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Interactive Map & Routes</h2>
            <p className="text-sm text-slate-500">{destination || 'Destination'}</p>
          </div>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Unable to load map information</h3>
          <p className="text-sm text-rose-600 max-w-md mx-auto mb-4">
            {error || `We couldn't resolve the location or coordinates for "${destination}".`}
          </p>
          <Button
            onClick={fetchMapData}
            variant="outline"
            className="inline-flex items-center space-x-2 border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Map</span>
          </Button>
        </div>
      </div>
    );
  }

  const mapCenter = [destinationLocation.latitude, destinationLocation.longitude];

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs">
            <Navigation className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Interactive Map & Routes</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {places.length} Attractions
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Explore {destinationLocation.name}, {destinationLocation.country} on OpenStreetMap & compute driving routes
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRecenterDestination}
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1.5 flex items-center space-x-1.5 border-slate-200 hover:bg-slate-50"
            title="Recenter Map on Destination"
          >
            <Compass className="h-3.5 w-3.5 text-indigo-600" />
            <span>Center City</span>
          </Button>
          {activeRoute && (
            <Button
              onClick={handleClearRoute}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1.5 flex items-center space-x-1.5 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Route</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Route Banner / Status */}
      {isCalculatingRoute && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-blue-900 animate-pulse">
          <div className="flex items-center space-x-3">
            <Car className="h-5 w-5 text-blue-600 animate-bounce" />
            <span className="text-sm font-medium">Calculating driving route from {destinationLocation.name}...</span>
          </div>
          <span className="text-xs text-blue-600 font-medium">Please wait</span>
        </div>
      )}

      {routeError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-900">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span className="text-sm font-medium">{routeError}</span>
          </div>
          {selectedPlace && (
            <Button
              onClick={() => handleCalculateRoute(selectedPlace)}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              Retry Route
            </Button>
          )}
        </div>
      )}

      {activeRoute && !isCalculatingRoute && (
        <div className="mb-6 p-4.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50/50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Active Route</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-sm font-bold text-slate-900">
                  {activeRoute.destinationName} ➔ {activeRoute.placeName}
                </span>
              </div>
              <p className="text-xs text-slate-500">Driving route computed using OpenStreetMap & OSRM Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 shrink-0 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl border border-indigo-100">
            {typeof activeRoute.distanceKm === 'number' && activeRoute.distanceKm < 0.05 ? (
              <>
                <div className="text-left">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Distance</span>
                  <span className="text-sm font-extrabold text-indigo-700">&lt; 0.1 km</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="text-left">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Est. Time</span>
                  <span className="text-sm font-extrabold text-blue-700">&lt; 1 min</span>
                </div>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div className="hidden sm:block text-left">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Same / adjacent location
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-left">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Distance</span>
                  <span className="text-sm font-extrabold text-indigo-700">{activeRoute.distanceKm} km</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="text-left">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">Est. Time</span>
                  <span className="text-sm font-extrabold text-blue-700">{activeRoute.durationMinutes} min</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Responsive Grid Layout (Map 65% / Places 35% on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container (7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="relative h-[420px] sm:h-[480px] lg:h-[540px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xs z-0 isolate">
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full z-0"
              attributionControl={true}
            >
              {/* OpenStreetMap Standard Tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              {/* Dynamic Viewport Controller */}
              <MapViewController
                center={mapCenter}
                zoom={13}
                selectedPosition={selectedPosition}
                routeGeometry={activeRoute?.geometry}
                fitRouteTrigger={fitRouteTrigger}
              />

              {/* Main Destination Marker */}
              <Marker position={mapCenter} icon={destinationIcon}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 text-center min-w-[160px]">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider mb-1.5">
                      Destination City
                    </div>
                    <h4 className="text-base font-bold text-slate-900 leading-tight">{destinationLocation.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">{destinationLocation.country}</p>
                    <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-1.5 font-mono">
                      {destinationLocation.latitude.toFixed(4)}°, {destinationLocation.longitude.toFixed(4)}°
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Tourist Place Markers */}
              {places.map((place, idx) => {
                const isSelected = selectedPlace?.name === place.name;
                const markerKey = `${place.name}_${place.latitude}_${place.longitude}`;
                const markerIcon = createCustomIcon(isSelected ? '#ea580c' : '#2563eb', isSelected);

                return (
                  <Marker
                    key={`marker-${idx}-${place.name}`}
                    position={[place.latitude, place.longitude]}
                    icon={markerIcon}
                    ref={(el) => {
                      if (el) markerRefs.current[markerKey] = el;
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-1 max-w-[240px]">
                        {place.imageUrl && (
                          <div className="relative h-24 w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                            <img
                              src={place.imageUrl}
                              alt={place.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          {place.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {place.category}
                            </span>
                          )}
                          {typeof place.rating === 'number' && !isNaN(place.rating) && (
                            <span className="inline-flex items-center text-xs font-bold text-amber-500">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                              {place.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{place.name}</h4>
                        {place.address && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2.5">{place.address}</p>
                        )}
                        <Button
                          onClick={() => handleCalculateRoute(place)}
                          size="sm"
                          variant="primary"
                          disabled={isCalculatingRoute}
                          className="w-full py-1.5 text-xs flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <Car className="h-3.5 w-3.5" />
                          <span>Route from {destinationLocation.name}</span>
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Driving Route Polyline */}
              {polylinePositions.length > 0 && (
                <Polyline
                  positions={polylinePositions}
                  pathOptions={{
                    color: '#4f46e5',
                    weight: 5,
                    opacity: 0.85,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }}
                />
              )}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 inline-block shadow-xs"></span>
                <span className="text-slate-700 font-medium">City: {destinationLocation.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block"></span>
                <span className="text-slate-600">Attraction ({places.length})</span>
              </div>
              {activeRoute && (
                <div className="flex items-center space-x-2">
                  <span className="h-1 w-3 rounded-full bg-indigo-600 inline-block"></span>
                  <span className="text-indigo-700 font-semibold">Active Route</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Places List Column (5 cols on lg, 4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Points of Interest</span>
              <span className="text-slate-400 font-normal">({places.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Click to locate or route</span>
          </div>

          {places.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-6 text-center text-slate-500">
              <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No attractions available for this destination.</p>
            </div>
          ) : (
            <div className="h-[420px] sm:h-[480px] lg:h-[500px] overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {places.map((place, idx) => {
                const isSelected = selectedPlace?.name === place.name;
                const isRouteTarget = activeRoute?.placeName === place.name;

                return (
                  <div
                    key={`list-${idx}-${place.name}`}
                    className={`rounded-2xl p-3.5 border transition-all duration-200 ${
                      isSelected || isRouteTarget
                        ? 'bg-indigo-50/60 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{place.name}</h4>
                      {typeof place.rating === 'number' && !isNaN(place.rating) && (
                        <span className="inline-flex items-center text-xs font-bold text-amber-500 shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      {place.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {place.category}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/80">
                      <button
                        onClick={() => handleShowOnMap(place)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-indigo-600'
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Show on Map</span>
                      </button>

                      <button
                        onClick={() => handleCalculateRoute(place)}
                        disabled={isCalculatingRoute}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer border ${
                          isRouteTarget
                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        <Car className="h-3.5 w-3.5" />
                        <span>Route</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MapSection;
