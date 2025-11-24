import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

interface WeatherData {
  temperature: number;
  minTemp: number;
  maxTemp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  aqi?: number; // Air Quality Index (optional as it might not always be available)
  location: string;
  forecast: {
    date: string;
    temperature: number;
    condition: string;
    icon: string;
  }[];
}

// Helper function to get weather emoji based on condition
const getWeatherEmoji = (condition: string): string => {
  if (!condition) return "🌤️"; // Default if condition is missing

  switch (condition) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "☁️";
    case "Rain":
      return "🌧️";
    case "Drizzle":
      return "🌦️";
    case "Thunderstorm":
      return "⛈️";
    case "Snow":
      return "❄️";
    case "Mist":
    case "Fog":
    case "Haze":
      return "🌫️";
    default:
      return "🌤️";
  }
};

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    });
  }, []);

  const handleLocationError = useCallback(() => {
    setError("Unable to get location. Please enable location services.");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, [handleLocationSuccess, handleLocationError]);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          setError("Weather service not available for your location");
        } else if (
          error.message.includes("401") ||
          error.message.includes("403")
        ) {
          setError("Weather service access denied");
        } else if (error.message.includes("500")) {
          setError("Weather service temporarily unavailable");
        } else {
          setError(`Weather error: ${error.message}`);
        }
      } else {
        setError("Failed to load weather data");
      }
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
    return weather.forecast.map((day) => ({
      ...day,
      formattedDate: new Date(day.date).toLocaleDateString(undefined, {
        weekday: "short",
      }),
    }));
  }, [weather]);

  if (loading) {
    return (
      <div
        className="h-full card animate-pulse"
        role="status"
        aria-label="Loading weather information"
      >
        <span className="sr-only">
          Loading weather data for your location...
        </span>
        <div className="h-8 bg-surface rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-surface rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-surface rounded w-3/4"></div>
          <div className="h-4 bg-surface rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full card">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full card"
    >
      {/* Current Weather */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-text-base mb-2">
          Current Weather
        </h3>
        <p className="text-sm text-text-muted mb-4">{weather.location}</p>
        <div className="flex items-center">
          <div
            className="text-6xl mr-4"
            role="img"
            aria-label={weather.condition}
          >
            {getWeatherEmoji(weather.condition)}
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-text-base">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-text-muted mt-1">
              H: {weather.maxTemp}° L: {weather.minTemp}°
            </div>
            <div className="text-text-muted mt-1">{weather.condition}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-text-muted">
            <span className="text-xs block mb-1">💧 Humidity</span>
            <div className="font-semibold text-text-base">
              {weather.humidity}%
            </div>
          </div>
          <div className="text-text-muted">
            <span className="text-xs block mb-1">💨 Wind</span>
            <div className="font-semibold text-text-base">
              {weather.windSpeed} km/h
            </div>
          </div>
          {weather.aqi !== undefined && (
            <div className="text-text-muted">
              <span className="text-xs block mb-1">🌫️ AQI</span>
              <div
                className={`font-semibold ${
                  weather.aqi <= 50
                    ? "text-success"
                    : weather.aqi <= 100
                      ? "text-warning"
                      : "text-error"
                }`}
              >
                {weather.aqi}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forecast */}
      <div>
        <h4 className="text-sm font-semibold text-text-base mb-2">
          3-Day Forecast
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {forecastWithFormattedDates.map((day) => (
            <div
              key={day.date}
              className="text-center p-2 bg-primary/5 rounded-lg"
            >
              <div className="text-xs text-text-muted mb-1">
                {day.formattedDate}
              </div>
              <div
                className="text-3xl my-1"
                role="img"
                aria-label={day.condition}
              >
                {day.icon}
              </div>
              <div className="text-sm font-semibold text-text-base">
                {day.temperature}°C
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;
