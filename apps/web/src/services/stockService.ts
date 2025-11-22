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

// Mock data for demonstration - replace with real API calls
const mockBSEStocks: StockData[] = [
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

const mockNSEStocks: StockData[] = [
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

// Simulate real-time price updates
const simulatePriceUpdate = (stock: StockData): StockData => {
  const changeAmount = (Math.random() - 0.5) * 10; // Random change between -5 and +5
  const newPrice = Math.max(1, stock.price + changeAmount);
  const newChange = stock.change + changeAmount;
  const newChangePercent = (newChange / (newPrice - newChange)) * 100;

  return {
    ...stock,
    price: Math.round(newPrice * 100) / 100,
    change: Math.round(newChange * 100) / 100,
    changePercent: Math.round(newChangePercent * 100) / 100,
  };
};

export const stockService = {
  // Get BSE stocks data
  getBSEStocks: async (): Promise<StockData[]> => {
    try {
      // In a real implementation, you would call a financial API
      // const response = await axios.get('API_ENDPOINT_FOR_BSE');
      // return response.data;

      // For now, return mock data with simulated updates
      return mockBSEStocks.map(simulatePriceUpdate);
    } catch (error) {
      console.error("Error fetching BSE stocks:", error);
      return mockBSEStocks;
    }
  },

  // Get NSE stocks data
  getNSEStocks: async (): Promise<StockData[]> => {
    try {
      // In a real implementation, you would call a financial API
      // const response = await axios.get('API_ENDPOINT_FOR_NSE');
      // return response.data;

      // For now, return mock data with simulated updates
      return mockNSEStocks.map(simulatePriceUpdate);
    } catch (error) {
      console.error("Error fetching NSE stocks:", error);
      return mockNSEStocks;
    }
  },

  // Get market indices
  getMarketIndices: async (): Promise<MarketIndex[]> => {
    const indices: MarketIndex[] = [
      { name: "SENSEX", value: 66234.56, change: 234.78, changePercent: 0.36 },
      { name: "NIFTY 50", value: 19845.3, change: 125.6, changePercent: 0.64 },
      {
        name: "BANK NIFTY",
        value: 44567.8,
        change: 234.5,
        changePercent: 0.53,
      },
    ];

    return indices.map((index) => ({
      ...index,
      value: index.value + (Math.random() - 0.5) * 50,
      change: index.change + (Math.random() - 0.5) * 10,
    }));
  },
};
