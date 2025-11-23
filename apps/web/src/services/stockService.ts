import api from "./axios";

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

const fetchStocks = async (
  endpoint: string,
  symbols: string[],
): Promise<StockData[]> => {
  const promises = symbols.map((symbol) =>
    api
      .get(`/api/stocks/${endpoint}?id=${symbol}`)
      .then((response) => response.data)
      .catch((error) => {
        console.warn(
          `Failed to fetch ${symbol} from ${endpoint}:`,
          error.message,
        );
        return null; // Return null on failure
      }),
  );

  const results = await Promise.allSettled(promises);

  return results
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => (result as PromiseFulfilledResult<StockData>).value);
};

export const stockService = {
  getBSEStocks: async (): Promise<StockData[]> => {
    try {
      return await fetchStocks("bse", bseStockSymbols);
    } catch (error) {
      console.error("Error fetching BSE stocks:", error);
      return [];
    }
  },

  getNSEStocks: async (): Promise<StockData[]> => {
    try {
      return await fetchStocks("groww", nseStockSymbols);
    } catch (error) {
      console.error("Error fetching NSE stocks:", error);
      return [];
    }
  },

  getMarketIndices: async (): Promise<MarketIndex[]> => {
    try {
      const nseIndices = await fetchStocks("groww", ["NIFTY 50", "BANKNIFTY"]);
      const bseIndices = await fetchStocks("bse", ["SENSEX"]);

      const indices = [...nseIndices, ...bseIndices].map((stock) => ({
        name: stock.symbol,
        value: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
      }));

      if (indices.length > 0) {
        return indices;
      }
      return []; // Return empty if all fail
    } catch (error) {
      console.error("Error fetching market indices:", error);
      return [];
    }
  },
};
