import { Request, Response } from "express";
import { env } from "../config/environment.js";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
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

    // Get current weather
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    console.log(
      `Fetching weather from: ${currentWeatherUrl.replace(apiKey, "API_KEY")}`,
    );

    try {
      const currentResponse = await fetch(currentWeatherUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Family-Portal/1.0",
        },
        timeout: 10000, // 10 second timeout
      });

      console.log(`OpenWeatherMap response status: ${currentResponse.status}`);

      if (!currentResponse.ok) {
        const errorText = await currentResponse.text();
        console.error(
          `OpenWeatherMap API error: ${currentResponse.status}`,
          errorText,
        );

        if (currentResponse.status === 401) {
          return res.status(500).json({
            message:
              "Weather service authentication failed - check your API key",
          });
        }
        if (currentResponse.status === 404) {
          return res.status(500).json({
            message: "Weather service not available for your location",
          });
        }
        if (currentResponse.status === 429) {
          return res
            .status(500)
            .json({ message: "Weather service rate limit exceeded" });
        }

        return res.status(500).json({
          message: `Weather service error: ${currentResponse.status}`,
        });
      }

      const currentData: OpenWeatherCurrent = await currentResponse.json();
      console.log(`Successfully fetched weather for: ${currentData.name}`);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return res
        .status(500)
        .json({ message: "Failed to connect to weather service" });
    }

    const currentData: OpenWeatherCurrent = await currentResponse.json();

    // Get 5-day forecast (we'll take next 3 days)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      // If forecast fails, we'll still return current weather
      console.warn("Forecast API failed, returning current weather only");
    }

    let forecast: WeatherData["forecast"] = [];

    if (forecastResponse.ok) {
      const forecastData: OpenWeatherForecast = await forecastResponse.json();

      // Group by day and take one reading per day (around noon)
      const dailyForecasts = new Map<string, (typeof forecastData.list)[0]>();

      forecastData.list.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();

        // Take the forecast closest to 12:00 (noon)
        const hour = date.getHours();
        if (hour >= 11 && hour <= 13) {
          if (!dailyForecasts.has(dayKey)) {
            dailyForecasts.set(dayKey, item);
          }
        }
      });

      // Convert to our format (next 3 days)
      forecast = Array.from(dailyForecasts.values())
        .slice(0, 3)
        .map((item) => ({
          date: new Date(item.dt * 1000).toISOString(),
          temperature: Math.round(item.main.temp),
          condition: item.weather[0].main,
          icon: getWeatherIcon(item.weather[0].main),
        }));
    }

    // Format the response
    const weatherData: WeatherData = {
      temperature: Math.round(currentData.main.temp),
      condition: currentData.weather[0].main,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
      forecast,
    };

    res.status(200).json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({
      message: "Failed to fetch weather data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
