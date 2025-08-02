import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  forecast: {
    date: string;
    temperature: number;
    condition: string;
    icon: string;
  }[];
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          setError('Unable to get location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, []);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location.lat, location.lon);
    }
  }, [location, fetchWeather]);

  const forecastWithFormattedDates = useMemo(() => {
    if (!weather) return [];
    return weather.forecast.map(day => ({
      ...day,
      formattedDate: new Date(day.date).toLocaleDateString(undefined, {
        weekday: 'short',
      })
    }));
  }, [weather]);

  if (loading) {
    return (
      <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      {/* Current Weather */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Current Weather
        </h3>
        <div className="flex items-center">
          <img
            src={weather.icon}
            alt={weather.condition}
            className="w-16 h-16 mr-4"
          />
          <div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.round(weather.temperature)}°C
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              {weather.condition}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-sm">Humidity</span>
            <div className="font-semibold">{weather.humidity}%</div>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-sm">Wind Speed</span>
            <div className="font-semibold">{weather.windSpeed} km/h</div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          3-Day Forecast
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {forecastWithFormattedDates.map((day) => (
            <div
              key={day.date}
              className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                {day.formattedDate}
              </div>
              <img
                src={day.icon}
                alt={day.condition}
                className="w-8 h-8 mx-auto"
              />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {Math.round(day.temperature)}°C
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;