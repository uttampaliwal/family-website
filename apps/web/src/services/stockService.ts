import axios from "axios";

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
  marketCap?: string;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

// Fallback stock data for when APIs are unavailable
const fallbackBSEStocks: StockData[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: 2845.3,
    change: 45.2,
    changePercent: 1.61,
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 3856.7,
    change: -32.5,
    changePercent: -0.84,
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    price: 1658.9,
    change: 18.4,
    changePercent: 1.12,
  },
  {
    symbol: "INFY",
    name: "Infosys",
    price: 1456.8,
    change: -8.3,
    changePercent: -0.57,
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    price: 945.6,
    change: 12.7,
    changePercent: 1.36,
  },
  {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever",
    price: 2567.8,
    change: 15.2,
    changePercent: 0.6,
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    price: 625.4,
    change: 8.9,
    changePercent: 1.44,
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel",
    price: 945.3,
    change: -5.6,
    changePercent: -0.59,
  },
];

const fallbackNSEStocks: StockData[] = [
  {
    symbol: "NIFTY 50",
    name: "Nifty 50 Index",
    price: 19845.3,
    change: 125.6,
    changePercent: 0.64,
  },
  {
    symbol: "BANKNIFTY",
    name: "Nifty Bank",
    price: 44567.8,
    change: 234.5,
    changePercent: 0.53,
  },
  {
    symbol: "KOTAKBANK",
    name: "Kotak Mahindra Bank",
    price: 1785.6,
    change: 22.3,
    changePercent: 1.26,
  },
  {
    symbol: "WIPRO",
    name: "Wipro",
    price: 425.8,
    change: -3.2,
    changePercent: -0.75,
  },
  {
    symbol: "AXISBANK",
    name: "Axis Bank",
    price: 1125.4,
    change: 14.8,
    changePercent: 1.33,
  },
  {
    symbol: "HCLTECH",
    name: "HCL Technologies",
    price: 1345.6,
    change: 18.9,
    changePercent: 1.42,
  },
  {
    symbol: "TECHM",
    name: "Tech Mahindra",
    price: 1567.3,
    change: -12.4,
    changePercent: -0.79,
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki",
    price: 9876.5,
    change: 67.8,
    changePercent: 0.69,
  },
];

// Popular Indian stock symbols for real-time data
const POPULAR_STOCKS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "SBIN",
  "BHARTIARTL",
  "KOTAKBANK",
  "WIPRO",
  "AXISBANK",
  "HCLTECH",
  "TECHM",
  "MARUTI",
  "LT",
  "SUNPHARMA",
  "M&M",
  "ULTRACEMCO",
  "NESTLEIND",
  "DRREDDY",
];

// API endpoints for Indian stock market data
// Keeping only Groww API as it's the most reliable free option

// Function to simulate real-time data updates (fallback when APIs fail)
const simulateRealTimeUpdate = (stock: StockData): StockData => {
  // Simulate small price movements (-1% to +1%) for realistic market simulation
  const changePercent = (Math.random() - 0.5) * 0.02; // -1% to +1%
  const change = stock.price * changePercent;
  const newPrice = Math.max(1, stock.price + change);

  return {
    ...stock,
    price: Math.round(newPrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 10000) / 100, // Round to 2 decimal places
  };
};

// Function to fetch NSE indices using Groww API
const fetchNSEIndices = async (): Promise<StockData[]> => {
  try {
    const results: StockData[] = [];

    // NSE indices using Groww API
    const nseIndices = [
      { id: "NIFTY 50", symbol: "NIFTY 50", name: "Nifty 50 Index" },
      { id: "BANKNIFTY", symbol: "BANKNIFTY", name: "Nifty Bank" },
    ];

    // Fetch indices from Groww API
    for (const index of nseIndices) {
      try {
        const stockData = await fetchFromGroww(index.id);
        if (stockData) {
          results.push({
            symbol: index.symbol,
            name: index.name,
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
          });
        }
      } catch (growwError) {
        console.warn(
          `Groww API failed for ${index.id}, falling back to Yahoo Finance:`,
          growwError,
        );

        // Fallback to Yahoo Finance
        try {
          const yahooSymbol = index.id === "NIFTY 50" ? "^NSEI" : "^NSEBANK";
          const response = await axios.get(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
            { timeout: 5000 },
          );

          const data = response.data;
          if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
            const meta = data.chart.result[0].meta;
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.previousClose || currentPrice;
            const change = currentPrice - previousClose;
            const changePercent = (change / previousClose) * 100;

            results.push({
              symbol: index.symbol,
              name: index.name,
              price: currentPrice,
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2)),
            });
          }
        } catch (yahooError) {
          console.warn(
            `Yahoo Finance fallback failed for ${index.id}:`,
            yahooError,
          );
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching NSE indices:", error);
    return [];
  }
};

// Function to fetch data from Groww API (Indian market specific)
const fetchFromGroww = async (symbol: string): Promise<StockData | null> => {
  try {
    const response = await axios.get(
      `https://api.groww.in/v1/live-data/quote?id=${symbol}`,
    );

    const data = response.data;
    if (data && data.data) {
      const quote = data.data;
      const currentPrice = quote.current_price || quote.ltp;
      const previousClose = quote.previous_close || quote.open_price;

      if (currentPrice && previousClose) {
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
          symbol: quote.symbol || symbol,
          name: quote.name || quote.company_name || symbol,
          price: currentPrice,
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
        };
      }
    }
    return null;
  } catch (error) {
    console.warn(`Groww API failed for ${symbol}:`, error);
    return null;
  }
};

// Batch fetch from Groww API for better performance
const fetchBatchFromGroww = async (symbols: string[]): Promise<StockData[]> => {
  const results: StockData[] = [];

  // Fetch in parallel with limited concurrency to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchPromises = batch.map((symbol) => fetchFromGroww(symbol));
    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach((stock, index) => {
      if (stock) {
        results.push(stock);
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
};

// Function to fetch BSE indices using Groww API
const fetchBSEIndices = async (): Promise<StockData[]> => {
  try {
    // Try Groww API first for SENSEX
    try {
      const stockData = await fetchFromGroww("SENSEX");
      if (stockData) {
        return [
          {
            symbol: "SENSEX",
            name: "BSE Sensex",
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
          },
        ];
      }
    } catch (growwError) {
      console.warn(
        "Groww SENSEX API failed, falling back to Yahoo Finance:",
        growwError,
      );
    }

    // Fallback to Yahoo Finance
    try {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/^BSESN?interval=1d&range=1d`,
        { timeout: 5000 },
      );

      const data = response.data;
      if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
        const meta = data.chart.result[0].meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose || currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return [
          {
            symbol: "SENSEX",
            name: "BSE Sensex",
            price: currentPrice,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
          },
        ];
      }
    } catch (yahooError) {
      console.warn("Yahoo Finance fallback failed for SENSEX:", yahooError);
    }

    return [];
  } catch (error) {
    console.error("Error fetching BSE indices:", error);
    return [];
  }
};

// Test function to verify API connectivity
export const testAPIConnectivity = async () => {
  console.log("Testing API connectivity...");

  try {
    // Test Groww API
    console.log("Testing Groww API...");
    const growwTest = await fetchFromGroww("RELIANCE");
    console.log("Groww API result:", growwTest);

    // Test Yahoo Finance
    console.log("Testing Yahoo Finance...");
    const yahooTest = await fetchFromYahooFinance("RELIANCE.NS");
    console.log("Yahoo Finance result:", yahooTest);

    return { groww: growwTest, yahoo: yahooTest };
  } catch (error) {
    console.error("API connectivity test failed:", error);
    return null;
  }
};

export const stockService = {
  // Get BSE stocks data with real API integration using Groww API
  getBSEStocks: async (): Promise<StockData[]> => {
    try {
      const results: StockData[] = [];

      // Fetch BSE indices first (SENSEX)
      const bseIndices = await fetchBSEIndices();
      results.push(...bseIndices);

      // Popular BSE stocks - using Groww API symbols
      // Note: Groww uses NSE symbols for most stocks, but we'll try BSE-specific symbols
      const bseStockSymbols = [
        "RELIANCE",
        "TCS",
        "HDFCBANK",
        "INFY",
        "ICICIBANK",
        "HINDUNILVR",
        "SBIN",
        "BHARTIARTL",
      ];

      // Fetch stocks from Groww API in batches
      const growwStocks = await fetchBatchFromGroww(bseStockSymbols);
      results.push(...growwStocks);

      // If Groww API didn't return enough data, try fallback APIs for missing stocks
      if (results.length < 5) {
        const missingSymbols = bseStockSymbols.filter(
          (symbol) => !results.some((stock) => stock.symbol === symbol),
        );

        for (const symbol of missingSymbols.slice(0, 3)) {
          let stockData = null;

          // Try Breeze Connect first (ICICI Securities - most reliable)
          if (
            BREEZE_API_KEY !== "demo" &&
            BREEZE_API_SECRET !== "demo" &&
            BREEZE_SESSION_TOKEN !== "demo"
          ) {
            stockData = await fetchFromBreeze(symbol);
          }

          // Try Groww API as fallback
          if (!stockData) {
            stockData = await fetchFromGroww(symbol);
          }

          // If no API data, use fallback with simulated updates
          if (!stockData) {
            const fallbackStock = fallbackBSEStocks.find(
              (s) => s.symbol === symbol,
            );
            if (fallbackStock) {
              stockData = simulateRealTimeUpdate(fallbackStock);
            }
          }

          if (stockData) {
            results.push(stockData);
          }

          await new Promise((resolve) => setTimeout(resolve, 100));

          // Try Yahoo Finance as fallback
          if (!stockData) {
            console.log(`Trying Yahoo Finance for ${symbol}`);
            stockData = await fetchFromYahooFinance(symbol + ".NS");
            if (stockData)
              console.log(`Yahoo Finance success for ${symbol}:`, stockData);
          }

          if (!stockData && ALPHA_VANTAGE_API_KEY !== "demo") {
            console.log(`Trying Alpha Vantage for ${symbol}`);
            stockData = await fetchFromAlphaVantage(symbol + ".NS");
            if (stockData)
              console.log(`Alpha Vantage success for ${symbol}:`, stockData);
          }

          if (stockData) {
            results.push(stockData);
          } else {
            console.log(`No data found for ${symbol}`);
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // If we got some real data, return it; otherwise use fallback
      if (results.length > 1) {
        return results.slice(0, 8); // Return top 8 stocks
      }

      console.warn("Using fallback BSE data with simulated updates");
      return fallbackBSEStocks.map(simulateRealTimeUpdate);
    } catch (error) {
      console.error("Error fetching BSE stocks:", error);
      return fallbackBSEStocks.map(simulateRealTimeUpdate);
    }
  },

  // Get NSE stocks data with real API integration using Groww API
  getNSEStocks: async (): Promise<StockData[]> => {
    try {
      const results: StockData[] = [];

      // Fetch NSE indices first (NIFTY 50, BANKNIFTY)
      const nseIndices = await fetchNSEIndices();
      results.push(...nseIndices);

      // Popular NSE stocks - Groww API works best with NSE symbols
      const nseStockSymbols = [
        "RELIANCE",
        "TCS",
        "HDFCBANK",
        "INFY",
        "ICICIBANK",
        "KOTAKBANK",
        "WIPRO",
        "AXISBANK",
      ];

      // Fetch stocks from Groww API in batches (primary source)
      const growwStocks = await fetchBatchFromGroww(nseStockSymbols);
      results.push(...growwStocks);

      // If Groww API didn't return enough data, try fallback APIs for missing stocks
      if (results.length < 5) {
        const missingSymbols = nseStockSymbols.filter(
          (symbol) => !results.some((stock) => stock.symbol === symbol),
        );

        for (const symbol of missingSymbols.slice(0, 3)) {
          let stockData = null;

          // Try Breeze Connect first (ICICI Securities - most reliable)
          if (
            BREEZE_API_KEY !== "demo" &&
            BREEZE_API_SECRET !== "demo" &&
            BREEZE_SESSION_TOKEN !== "demo"
          ) {
            stockData = await fetchFromBreeze(symbol);
          }

          // Try Groww API as fallback
          if (!stockData) {
            stockData = await fetchFromGroww(symbol);
          }

          // If no API data, use fallback with simulated updates
          if (!stockData) {
            const fallbackStock = fallbackNSEStocks.find(
              (s) => s.symbol === symbol,
            );
            if (fallbackStock) {
              stockData = simulateRealTimeUpdate(fallbackStock);
            }
          }

          if (stockData) {
            results.push(stockData);
          }

          await new Promise((resolve) => setTimeout(resolve, 100));

          // Try Yahoo Finance as fallback
          if (!stockData) {
            console.log(`Trying Yahoo Finance for ${symbol}`);
            stockData = await fetchFromYahooFinance(symbol + ".NS");
            if (stockData)
              console.log(`Yahoo Finance success for ${symbol}:`, stockData);
          }

          if (!stockData && FINNHUB_API_KEY !== "demo") {
            console.log(`Trying Finnhub for ${symbol}`);
            stockData = await fetchFromFinnhub(symbol + ".NS");
            if (stockData)
              console.log(`Finnhub success for ${symbol}:`, stockData);
          }

          if (stockData) {
            results.push(stockData);
          } else {
            console.log(`No data found for ${symbol}`);
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // If we got some real data, return it; otherwise use fallback
      if (results.length > 1) {
        return results.slice(0, 8); // Return top 8 stocks
      }

      console.warn("Using fallback NSE data with simulated updates");
      return fallbackNSEStocks.map(simulateRealTimeUpdate);
    } catch (error) {
      console.error("Error fetching NSE stocks:", error);
      return fallbackNSEStocks.map(simulateRealTimeUpdate);
    }
  },

  // Get market indices with real data
  getMarketIndices: async (): Promise<MarketIndex[]> => {
    try {
      const indices: MarketIndex[] = [];

      // Fetch SENSEX
      try {
        const bseData = await fetchBSEIndices();
        if (bseData.length > 0) {
          indices.push({
            name: "SENSEX",
            value: bseData[0].price,
            change: bseData[0].change,
            changePercent: bseData[0].changePercent,
          });
        }
      } catch (error) {
        console.warn("Failed to fetch SENSEX:", error);
      }

      // Fetch NIFTY indices
      try {
        const nseData = await fetchNSEIndices();
        nseData.forEach((index) => {
          indices.push({
            name: index.symbol,
            value: index.price,
            change: index.change,
            changePercent: index.changePercent,
          });
        });
      } catch (error) {
        console.warn("Failed to fetch NIFTY indices:", error);
      }

      // If we got real data, return it
      if (indices.length > 0) {
        return indices;
      }

      // Fallback to mock data
      return [
        {
          name: "SENSEX",
          value: 66234.56,
          change: 234.78,
          changePercent: 0.36,
        },
        {
          name: "NIFTY 50",
          value: 19845.3,
          change: 125.6,
          changePercent: 0.64,
        },
        {
          name: "BANK NIFTY",
          value: 44567.8,
          change: 234.5,
          changePercent: 0.53,
        },
      ];
    } catch (error) {
      console.error("Error fetching market indices:", error);
      return [
        {
          name: "SENSEX",
          value: 66234.56,
          change: 234.78,
          changePercent: 0.36,
        },
        {
          name: "NIFTY 50",
          value: 19845.3,
          change: 125.6,
          changePercent: 0.64,
        },
        {
          name: "BANK NIFTY",
          value: 44567.8,
          change: 234.5,
          changePercent: 0.53,
        },
      ];
    }
  },
};
