import { Request, Response } from "express";
import axios from "axios";
import { logError } from "../utils/logger";

// --- Groww API Proxy (Mock Data) ---
export const getGrowwStockData = async (req: Request, res: Response) => {
  const stockId = req.query.id as string;
  if (!stockId) {
    return res.status(400).json({ message: "Stock ID is required" });
  }

  // For now, returning mock data instead of proxying to Groww API
  const price = Math.random() * 1000 + 100; // Random price between 100-1100
  const change = (Math.random() - 0.5) * 20; // Random change -10 to +10
  const mockData = {
    symbol: stockId,
    name: `${stockId} Ltd.`, // Mock name
    price: Math.round(price * 100) / 100, // Round to 2 decimals
    change: Math.round(change * 100) / 100,
    changePercent: Math.round((change / (price - change)) * 10000) / 100, // Calculate percentage
    volume: Math.floor(Math.random() * 1000000).toString(), // Random volume
    marketCap: (Math.random() * 1000000).toFixed(2), // Mock market cap
  };

  res.json(mockData);
};

// --- BSE API (Breeze) Proxy ---
// Note: This is a placeholder for the actual Breeze SDK implementation.
// The BREEZE_API_KEY should be handled here, on the server.
export const getBseStockData = async (req: Request, res: Response) => {
  const stockId = req.query.id as string;
  if (!stockId) {
    return res.status(400).json({ message: "Stock ID is required for BSE" });
  }

  // For mock data, no API credentials needed
  // const apiKey = process.env.BREEZE_API_KEY;
  // const apiSecret = process.env.BREEZE_API_SECRET; // Assuming a secret is also needed

  // if (!apiKey || !apiSecret) {
  //     logError(new Error('Breeze API credentials are not configured in .env'), 'bse_api_proxy');
  //     return res.status(500).json({ message: 'BSE API integration is not configured on the server.' });
  // }

  try {
    // =================================================================
    // TODO: Replace this with the actual Breeze SDK implementation.
    // Example:
    // const breeze = new BreezeConnect({ api_key: apiKey });
    // await breeze.generate_session(api_secret, process.env.BREEZE_SESSION_TOKEN);
    // const stockData = await breeze.get_quotes({ stock_code: stockId, ... });
    // =================================================================

    // For now, returning mock data.
    const price = Math.random() * 1000 + 100; // Random price between 100-1100
    const change = (Math.random() - 0.5) * 20; // Random change -10 to +10
    const mockData = {
      symbol: stockId,
      name: `${stockId} Ltd.`, // Mock name
      price: Math.round(price * 100) / 100, // Round to 2 decimals
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / (price - change)) * 10000) / 100, // Calculate percentage
      volume: Math.floor(Math.random() * 1000000).toString(), // Random volume
      marketCap: (Math.random() * 1000000).toFixed(2), // Mock market cap
    };

    res.json(mockData);
  } catch (error) {
    logError(error as Error, "bse_api_proxy", { stockId });
    res.status(500).json({ message: "Error fetching data from BSE API" });
  }
};
