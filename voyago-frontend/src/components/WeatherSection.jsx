import React, { useState, useEffect } from 'react';
import { getWeather } from '../services/weatherService';
import Button from './Button';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
} from 'lucide-react';

const WeatherSection = ({ destination }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeatherData() {
      if (!destination || !destination.trim()) {
        if (isMounted) {
          setWeatherData(null);
          setIsLoading(false);
          setError('');
        }
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const data = await getWeather(destination);
        if (isMounted) {
          setWeatherData(data);
          setError('');
        }
      } catch (err) {
        console.error('Failed to load weather for destination:', destination, err);
        if (isMounted) {
          if (err.response?.status === 404) {
            setError(`Could not resolve weather location for "${destination}".`);
          } else if (err.response?.data?.message) {
            setError(err.response.data.message);
          } else if (err.message === 'Network Error' || !err.response) {
            setError('Unable to connect to weather service. Please check your network.');
          } else {
            setError('Failed to load weather information. Please try again.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWeatherData();

    return () => {
      isMounted = false;
    };
  }, [destination, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Helper to get weather icon based on code and condition
  const getWeatherIcon = (code, className = 'h-6 w-6') => {
    if (code === undefined || code === null) {
      return <Sun className={`${className} text-amber-500`} />;
    }
    if (code === 0) {
      return <Sun className={`${className} text-amber-500`} />;
    }
    if (code === 1 || code === 2) {
      return <CloudSun className={`${className} text-amber-400`} />;
    }
    if (code === 3) {
      return <Cloud className={`${className} text-slate-400`} />;
    }
    if (code === 45 || code === 48) {
      return <CloudFog className={`${className} text-slate-400`} />;
    }
    if (code >= 51 && code <= 57) {
      return <CloudDrizzle className={`${className} text-blue-400`} />;
    }
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
      return <CloudRain className={`${className} text-blue-500`} />;
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      return <CloudSnow className={`${className} text-indigo-300`} />;
    }
    if (code >= 95) {
      return <CloudLightning className={`${className} text-purple-500`} />;
    }
    return <CloudSun className={`${className} text-amber-400`} />;
  };

  // Format date helper for forecast
  const formatForecastDate = (dateString, index) => {
    if (!dateString) return '';
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';

    try {
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  if (!destination || !destination.trim()) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-100 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sun className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Destination Weather</h3>
            <p className="text-xs text-slate-500">Live conditions and 7-day forecast</p>
          </div>
        </div>

        {weatherData?.location && (
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-medium text-slate-700">
              {weatherData.location.name}
              {weatherData.location.country ? `, ${weatherData.location.country}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-slate-100 rounded-xl md:col-span-1" />
            <div className="h-28 bg-slate-100 rounded-xl md:col-span-2" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-rose-900 mb-1">Weather data currently unavailable</p>
          <p className="text-xs text-rose-700 max-w-md mx-auto mb-3">{error}</p>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="inline-flex items-center space-x-1.5 text-xs px-3.5 py-1.5 text-rose-700 border-rose-300 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Weather Content */}
      {!isLoading && !error && weatherData && (
        <div className="space-y-6">
          {/* Current Weather Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 rounded-xl p-5 sm:p-6 border border-blue-100/60">
            {/* Main Temperature & Condition */}
            <div className="lg:col-span-5 flex items-center space-x-5">
              <div className="p-3.5 rounded-2xl bg-white shadow-xs border border-blue-100/80">
                {getWeatherIcon(weatherData.current?.weatherCode, 'h-12 w-12')}
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                    {weatherData.current?.temperature !== undefined && weatherData.current?.temperature !== null
                      ? `${Math.round(weatherData.current.temperature)}°C`
                      : '--'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {weatherData.current?.condition || 'Current weather'}
                </p>
                {weatherData.current?.feelsLike !== undefined && weatherData.current?.feelsLike !== null && (
                  <p className="text-xs text-slate-500">
                    Feels like {Math.round(weatherData.current.feelsLike)}°C
                  </p>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 self-center">
              {/* Humidity */}
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1">
                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                  <span>Humidity</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {weatherData.current?.humidity !== undefined && weatherData.current?.humidity !== null
                    ? `${weatherData.current.humidity}%`
                    : '--'}
                </p>
              </div>

              {/* Wind Speed */}
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1">
                  <Wind className="h-3.5 w-3.5 text-teal-500" />
                  <span>Wind</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {weatherData.current?.windSpeed !== undefined && weatherData.current?.windSpeed !== null
                    ? `${weatherData.current.windSpeed} km/h`
                    : '--'}
                </p>
              </div>

              {/* Precipitation */}
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1">
                  <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                  <span>Precipitation</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {weatherData.current?.precipitation !== undefined && weatherData.current?.precipitation !== null
                    ? `${weatherData.current.precipitation} mm`
                    : '0 mm'}
                </p>
              </div>

              {/* Coordinates / Country */}
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 mb-1">
                  <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                  <span>Location</span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate" title={weatherData.location?.name}>
                  {weatherData.location?.name || destination}
                </p>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast Grid */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>7-Day Weather Outlook</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weatherData.forecast.map((day, idx) => (
                  <div
                    key={day.date || idx}
                    className="bg-slate-50/80 hover:bg-white p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all text-center flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 mb-1.5">
                        {formatForecastDate(day.date, idx)}
                      </p>
                      <div className="flex justify-center my-2">
                        {getWeatherIcon(day.weatherCode, 'h-7 w-7')}
                      </div>
                      <p className="text-2xs font-medium text-slate-600 line-clamp-1 mb-2" title={day.condition}>
                        {day.condition || 'Clear'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-center space-x-1.5 text-xs">
                        <span className="font-bold text-slate-900">
                          {day.maxTemperature !== null && day.maxTemperature !== undefined
                            ? `${Math.round(day.maxTemperature)}°`
                            : '--'}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">
                          {day.minTemperature !== null && day.minTemperature !== undefined
                            ? `${Math.round(day.minTemperature)}°`
                            : '--'}
                        </span>
                      </div>

                      {day.precipitationProbability !== null && day.precipitationProbability !== undefined && (
                        <div className="flex items-center justify-center space-x-1 mt-1 text-2xs text-blue-600 font-medium">
                          <Droplets className="h-2.5 w-2.5" />
                          <span>{day.precipitationProbability}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherSection;
