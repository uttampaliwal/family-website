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
  "RELIANCE.NS",
  "TCS.NS",
  "HDFCBANK.NS",
  "INFY.NS",
  "ICICIBANK.NS",
  "HINDUNILVR.NS",
  "SBIN.NS",
  "BHARTIARTL.NS",
  "KOTAKBANK.NS",
  "WIPRO.NS",
  "AXISBANK.NS",
  "HCLTECH.NS",
  "TECHM.NS",
  "MARUTI.NS",
  "LT.NS",
  "SUNPHARMA.NS",
  "M&M.NS",
  "ULTRACEMCO.NS",
  "NESTLEIND.NS",
  "DRREDDY.NS",
];

// API endpoints for Indian stock market data
const ALPHA_VANTAGE_API_KEY =
  import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "demo";
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || "demo";

// Function to fetch data from Alpha Vantage (free tier: 25 calls/day)
const fetchFromAlphaVantage = async (
  symbol: string,
): Promise<StockData | null> => {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
    );

    const data = response.data;
    if (data["Global Quote"] && data["Global Quote"]["01. symbol"]) {
      const quote = data["Global Quote"];
      return {
        symbol: symbol.replace(".NS", ""),
        name: symbol.replace(".NS", ""),
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
      };
    }
    return null;
  } catch (error) {
    console.warn(`Alpha Vantage API failed for ${symbol}:`, error);
    return null;
  }
};

// Function to fetch data from Finnhub (free tier: 60 calls/minute)
const fetchFromFinnhub = async (symbol: string): Promise<StockData | null> => {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
    );

    const data = response.data;
    if (data.c && data.d !== undefined) {
      const changePercent = (data.d / (data.c - data.d)) * 100;
      return {
        symbol: symbol.replace(".NS", ""),
        name: symbol.replace(".NS", ""),
        price: data.c,
        change: data.d,
        changePercent: parseFloat(changePercent.toFixed(2)),
      };
    }
    return null;
  } catch (error) {
    console.warn(`Finnhub API failed for ${symbol}:`, error);
    return null;
  }
};

// Function to fetch data from Yahoo Finance (unofficial API)
const fetchFromYahooFinance = async (
  symbol: string,
): Promise<StockData | null> => {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    );

    const data = response.data;
    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      const meta = data.chart.result[0].meta;
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose || currentPrice;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        symbol: symbol.replace(".NS", ""),
        name: meta.longName || symbol.replace(".NS", ""),
        price: currentPrice,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
      };
    }
    return null;
  } catch (error) {
    console.warn(`Yahoo Finance API failed for ${symbol}:`, error);
    return null;
  }
};

// Function to fetch NSE indices
const fetchNSEIndices = async (): Promise<StockData[]> => {
  try {
    // Try to get NIFTY and BANKNIFTY data
    const indices = ["^NSEI", "^NSEBANK"]; // NIFTY 50 and BANK NIFTY
    const results: StockData[] = [];

    for (const index of indices) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${index}?interval=1d&range=1d`,
        );

        const data = response.data;
        if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
          const meta = data.chart.result[0].meta;
          const currentPrice = meta.regularMarketPrice;
          const previousClose = meta.previousClose || currentPrice;
          const change = currentPrice - previousClose;
          const changePercent = (change / previousClose) * 100;

          results.push({
            symbol: index === "^NSEI" ? "NIFTY 50" : "BANKNIFTY",
            name: index === "^NSEI" ? "Nifty 50 Index" : "Nifty Bank",
            price: currentPrice,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch index ${index}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching NSE indices:", error);
    return [];
  }
};

// Function to fetch BSE indices
const fetchBSEIndices = async (): Promise<StockData[]> => {
  try {
    // Try to get SENSEX data
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/^BSESN?interval=1d&range=1d`,
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
    return [];
  } catch (error) {
    console.error("Error fetching BSE indices:", error);
    return [];
  }
};

export const stockService = {
  // Get BSE stocks data with real API integration
  getBSEStocks: async (): Promise<StockData[]> => {
    try {
      const results: StockData[] = [];
      const bseIndices = await fetchBSEIndices();

      // Add BSE indices first
      results.push(...bseIndices);

      // Try to fetch real data for popular BSE stocks
      const bseStocks = POPULAR_STOCKS.slice(0, 8); // Limit to avoid rate limits

      for (const symbol of bseStocks) {
        let stockData = null;

        // Try different APIs in order of preference
        if (ALPHA_VANTAGE_API_KEY !== "demo") {
          stockData = await fetchFromAlphaVantage(symbol);
        }

        if (!stockData && FINNHUB_API_KEY !== "demo") {
          stockData = await fetchFromFinnhub(symbol);
        }

        if (!stockData) {
          stockData = await fetchFromYahooFinance(symbol);
        }

        if (stockData) {
          results.push(stockData);
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // If we got some real data, return it; otherwise use fallback
      if (results.length > 1) {
        return results.slice(0, 8); // Return top 8 stocks
      }

      console.warn("Using fallback BSE data due to API failures");
      return fallbackBSEStocks;
    } catch (error) {
      console.error("Error fetching BSE stocks:", error);
      return fallbackBSEStocks;
    }
  },

  // Get NSE stocks data with real API integration
  getNSEStocks: async (): Promise<StockData[]> => {
    try {
      const results: StockData[] = [];
      const nseIndices = await fetchNSEIndices();

      // Add NSE indices first
      results.push(...nseIndices);

      // Try to fetch real data for popular NSE stocks
      const nseStocks = POPULAR_STOCKS.slice(0, 8); // Limit to avoid rate limits

      for (const symbol of nseStocks) {
        let stockData = null;

        // Try different APIs in order of preference
        if (ALPHA_VANTAGE_API_KEY !== "demo") {
          stockData = await fetchFromAlphaVantage(symbol);
        }

        if (!stockData && FINNHUB_API_KEY !== "demo") {
          stockData = await fetchFromFinnhub(symbol);
        }

        if (!stockData) {
          stockData = await fetchFromYahooFinance(symbol);
        }

        if (stockData) {
          results.push(stockData);
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // If we got some real data, return it; otherwise use fallback
      if (results.length > 1) {
        return results.slice(0, 8); // Return top 8 stocks
      }

      console.warn("Using fallback NSE data due to API failures");
      return fallbackNSEStocks;
    } catch (error) {
      console.error("Error fetching NSE stocks:", error);
      return fallbackNSEStocks;
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
