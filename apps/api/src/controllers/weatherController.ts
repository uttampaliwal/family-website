import { Request, Response } from "express";

// Mock data for weather
const mockWeather = {
  temperature: 25,
  description: "Sunny",
  location: "Udaipur, Rajasthan",
  humidity: 60,
  windSpeed: 10,
  forecast: [
    {
      date: new Date(
        new Date().setDate(new Date().getDate() + 1),
      ).toISOString(),
      temperature: 26,
      condition: "Partly cloudy",
      icon: "https://example.com/partly-cloudy.png",
    },
    {
      date: new Date(
        new Date().setDate(new Date().getDate() + 2),
      ).toISOString(),
      temperature: 24,
      condition: "Showers",
      icon: "https://example.com/showers.png",
    },
    {
      date: new Date(
        new Date().setDate(new Date().getDate() + 3),
      ).toISOString(),
      temperature: 27,
      condition: "Sunny",
      icon: "https://example.com/sunny.png",
    },
  ],
};

export const getWeather = (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required" });
  }

  // In a real application, you would use the lat and lon to get real weather data.
  // For this mock implementation, we return the same weather data regardless of location.
  return res.status(200).json(mockWeather);
};
