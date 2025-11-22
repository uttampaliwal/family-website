import { Request, Response } from "express";
import { env } from "../config/environment.js";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  forecast: {
    date: string;
    temperature: number;
    condition: string;
    icon: string;
  }[];
}

interface OpenWeatherCurrent {
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  name: string;
}

interface OpenWeatherForecast {
  list: Array<{
    dt: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    main: {
      temp: number;
    };
  }>;
}

const getWeatherIcon = (condition: string): string => {
  const iconMap: Record<string, string> = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️",
  };
  return iconMap[condition] || "🌤️";
};

export const getWeather = async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }
    const apiKey = env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "Weather service configuration error" });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    let currentData: OpenWeatherCurrent;
    try {
      const currentResponse = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Family-Portal/1.0",
        },
      });
      clearTimeout(timeoutId);
      if (!currentResponse.ok) {
        const status = currentResponse.status;
        if (status === 401) {
          return res.status(500).json({
            message:
              "Weather service authentication failed - check your API key",
          });
        }
        if (status === 404) {
          return res.status(500).json({
            message: "Weather service not available for your location",
          });
        }
        if (status === 429) {
          return res
            .status(500)
            .json({ message: "Weather service rate limit exceeded" });
        }
        return res
          .status(500)
          .json({ message: `Weather service error: ${status}` });
      }
      currentData = await currentResponse.json();
    } catch {
      clearTimeout(timeoutId);
      return res
        .status(500)
        .json({ message: "Failed to connect to weather service" });
    }

    const forecastController = new AbortController();
    const forecastTimeoutId = setTimeout(
      () => forecastController.abort(),
      10000,
    );
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    let forecast: WeatherData["forecast"] = [];
    try {
      const forecastResponse = await fetch(forecastUrl, {
        signal: forecastController.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Family-Portal/1.0",
        },
      });
      clearTimeout(forecastTimeoutId);
      if (forecastResponse.ok) {
        const forecastData: OpenWeatherForecast = await forecastResponse.json();
        const dailyForecasts = new Map<string, (typeof forecastData.list)[0]>();
        forecastData.list.forEach((item) => {
          const date = new Date(item.dt * 1000);
          const dayKey = date.toDateString();
          const hour = date.getHours();
          if (hour >= 11 && hour <= 13 && !dailyForecasts.has(dayKey)) {
            dailyForecasts.set(dayKey, item);
          }
        });
        forecast = Array.from(dailyForecasts.values())
          .slice(0, 3)
          .map((item) => ({
            date: new Date(item.dt * 1000).toISOString(),
            temperature: Math.round(item.main.temp),
            condition: item.weather[0].main,
            icon: getWeatherIcon(item.weather[0].main),
          }));
      }
    } catch {
      clearTimeout(forecastTimeoutId);
    }

    const weatherData: WeatherData = {
      temperature: Math.round(currentData.main.temp),
      condition: currentData.weather[0].main,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6),
      location: currentData.name,
      forecast,
    };

    return res.status(200).json(weatherData);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch weather data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
