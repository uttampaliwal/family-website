import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { stockService } from "../services/stockService";
import type { StockData } from "../services/stockService";
import "../styles/stock-ticker.css";

const ScrollingTicker: React.FC<{
  stocks: StockData[];
  color: string;
  exchange: string;
}> = ({ stocks, color, exchange }) => {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate stocks array for seamless scrolling
  const duplicatedStocks = [...stocks, ...stocks];

  // Add market status indicator
  const getMarketStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();

    // Simple market hours check (9:15 AM to 3:30 PM, Monday to Friday)
    if (day >= 1 && day <= 5 && hours >= 9 && hours < 16) {
      return { status: "MARKET OPEN", color: "bg-green-500" };
    }
    return { status: "MARKET CLOSED", color: "bg-red-500" };
  };

  const marketStatus = getMarketStatus();

  return (
    <div
      className={`${color} text-white py-2.5 overflow-hidden relative border-t border-black/10`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center">
        {/* Exchange label with market status */}
        <div className="flex items-center px-4 bg-black/20 py-1 border-r border-black/20">
          <span className="font-bold text-sm uppercase tracking-wide">
            {exchange}
          </span>
          <div
            className={`ml-2 px-1.5 py-0.5 text-xs rounded ${marketStatus.color}`}
          >
            {marketStatus.status}
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center px-3 bg-black/10 border-r border-black/20">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-xs font-medium">LIVE</span>
        </div>

        {/* Scrolling stocks */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex items-center space-x-6"
            animate={{
              x: isPaused ? 0 : "-50%",
            }}
            transition={{
              x: {
                type: "tween",
                ease: "linear",
                duration: 25,
                repeat: Infinity,
                repeatType: "loop",
              },
            }}
          >
            {duplicatedStocks.map((stock, index) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={`${stock.symbol}-${index}`}
                  className="flex items-center space-x-2 whitespace-nowrap border-r border-white/20 pr-6"
                >
                  <span className="font-bold text-sm">{stock.symbol}</span>
                  <span className="text-xs opacity-80 max-w-[120px] truncate">
                    {stock.name}
                  </span>
                  <span className="font-semibold text-sm">
                    ₹{stock.price.toLocaleString("en-IN")}
                  </span>
                  <div
                    className={`flex items-center space-x-1 text-xs font-medium ${isPositive ? "text-green-300" : "text-red-300"}`}
                  >
                    <span>{isPositive ? "▲" : "▼"}</span>
                    <span>{Math.abs(stock.change).toFixed(2)}</span>
                    <span>({Math.abs(stock.changePercent).toFixed(2)}%)</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Timestamp */}
        <div className="px-4 text-xs opacity-75 bg-black/10">
          {new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
          PAUSED
        </div>
      )}
    </div>
  );
};

const StockMarketTicker: React.FC = () => {
  const [bseStocks, setBseStocks] = useState<StockData[]>([]);
  const [nseStocks, setNseStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const [bseData, nseData] = await Promise.all([
          stockService.getBSEStocks(),
          stockService.getNSEStocks(),
        ]);
        setBseStocks(bseData);
        setNseStocks(nseData);
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();

    // Update stock data every 60 seconds
    const interval = setInterval(fetchStockData, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3">
          <div className="flex items-center px-4">
            <div className="px-4 font-bold text-sm uppercase tracking-wide bg-black/20 py-1">
              BSE
            </div>
            <div className="flex-1 text-center text-sm">
              Loading market data...
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3">
          <div className="flex items-center px-4">
            <div className="px-4 font-bold text-sm uppercase tracking-wide bg-black/20 py-1">
              NSE
            </div>
            <div className="flex-1 text-center text-sm">
              Loading market data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ScrollingTicker
        stocks={bseStocks}
        color="bg-gradient-to-r from-blue-600 to-blue-700"
        exchange="BSE"
      />
      <ScrollingTicker
        stocks={nseStocks}
        color="bg-gradient-to-r from-green-600 to-green-700"
        exchange="NSE"
      />
    </div>
  );
};

export default StockMarketTicker;
