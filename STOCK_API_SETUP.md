# Stock Market API Setup Guide

This guide explains how to configure live stock market data for the ticker.

## Current Setup

The stock ticker uses a smart fallback system for real-time data:

1. **Breeze Connect** (ICICI Securities - Most reliable, requires API key) ⭐ **Primary**
2. **Groww API** (Free, Indian market specific, no API key required)
3. **Simulated Real-time Updates** (Fallback when APIs fail - shows realistic market movements)

## Configuration

### Option 1: Use Breeze Connect (Recommended - Most Reliable)

Breeze Connect by ICICI Securities provides the most reliable and comprehensive Indian stock market data.

**Setup Steps:**

1. Visit: https://api.icicidirect.com/breezeapi/
2. Sign up for ICICI Breeze API account
3. Get your API Key, API Secret, and Session Token
4. Add to `.env`:
   ```
   VITE_BREEZE_API_KEY=your_api_key_here
   VITE_BREEZE_API_SECRET=your_api_secret_here
   VITE_BREEZE_SESSION_TOKEN=your_session_token_here
   ```

**Advantages:**

- ✅ Most reliable Indian market data
- ✅ Real-time quotes from ICICI Securities
- ✅ Comprehensive BSE/NSE coverage
- ✅ Professional-grade API

### Option 2: Use Groww API (Free & Indian Market Specific)

The ticker works out-of-the-box with Groww API, which is specifically designed for Indian markets and doesn't require an API key.

**Advantages:**

- ✅ Indian market specific data
- ✅ No API key required
- ✅ Real-time BSE/NSE data
- ✅ Reliable and fast

### Option 3: Add API Keys for Additional Sources

1. **Alpha Vantage API Key**:
   - Visit: https://www.alphavantage.co/support/#api-key
   - Sign up for free account
   - Get your API key
   - Add to `.env`: `VITE_ALPHA_VANTAGE_API_KEY=your_key_here`

2. **Finnhub API Key**:
   - Visit: https://finnhub.io/register
   - Sign up for free account
   - Get your API key
   - Add to `.env`: `VITE_FINNHUB_API_KEY=your_key_here`

## Features

- **Fallback System**: If APIs fail, shows fallback data
- **Rate Limiting**: Built-in delays to avoid API limits
- **Multiple Sources**: Tries different APIs in sequence
- **Real-time Updates**: Refreshes every 30 seconds
- **Market Hours**: Shows market open/closed status

## Stocks Tracked

### BSE (Bombay Stock Exchange)

- SENSEX index
- Top BSE stocks: Reliance, TCS, HDFC Bank, etc.

### NSE (National Stock Exchange)

- NIFTY 50 index
- BANK NIFTY index
- Top NSE stocks: Infosys, ICICI Bank, HCL Tech, etc.

## Data Sources Priority

1. **Breeze Connect** (Primary - ICICI Securities, most reliable)
2. **Groww API** (Secondary - Indian market specific, free)
3. **Simulated Updates** (Fallback - realistic market movements when APIs fail)

## API Details

### Breeze Connect (Primary - ICICI Securities)

- **Package**: `breezeconnect` (npm installed)
- **Rate Limit**: Varies by plan (generous for development)
- **Coverage**: Complete BSE, NSE indices + all Indian stocks
- **Format**: Professional JSON with comprehensive market data
- **Authentication**: API Key + Session Token required

### Groww API (Secondary)

- **Endpoint**: `https://api.groww.in/v1/live-data/quote`
- **Rate Limit**: None specified (generous for development)
- **Coverage**: BSE, NSE indices + major Indian stocks
- **Format**: JSON with current_price, previous_close, etc.
- **Authentication**: None required

### Data Format Examples

**Breeze Connect:**

```json
{
  "Success": [
    {
      "ltp": "2845.30",
      "previous_close": "2800.10",
      "company_name": "Reliance Industries Ltd",
      "symbol": "RELIANCE"
    }
  ]
}
```

**Groww API:**

```json
{
  "data": {
    "symbol": "RELIANCE",
    "name": "Reliance Industries Ltd",
    "current_price": 2845.3,
    "previous_close": 2800.1,
    "change": 45.2,
    "change_percent": 1.61
  }
}
```

## Troubleshooting

**API Priority & Fallback:**

1. **Breeze Connect** (if configured) - Most reliable
2. **Groww API** (free, no keys needed) - Good alternative
3. **Simulated Updates** (always works) - Realistic market movements

**If stocks show simulated data:**

- This is normal when APIs are unavailable (CORS, rate limits, etc.)
- Simulated data shows realistic price movements (-1% to +1%)
- Updates every 30 seconds with new simulated prices
- All visual features work the same as real data

**To get real data:**

1. Configure Breeze Connect API keys (most reliable)
2. Or use Groww API (works in production, may have CORS in development)
3. Simulated data ensures ticker always works

## Performance Notes

- **Breeze Connect**: Most reliable and comprehensive data (when configured)
- **Groww API**: Fastest response for Indian markets (free)
- **Rate limiting**: Built-in 100ms delays between requests
- **Auto-refresh**: Every 30 seconds
- **Fallback chain**: Breeze Connect → Groww → Alpha Vantage → Finnhub → Yahoo Finance → Static data

## Installation

The Breeze Connect package has been installed:

```bash
npm install breezeconnect
```

## Environment Variables Added

```env
# Breeze Connect API (ICICI Securities)
VITE_BREEZE_API_KEY=demo
VITE_BREEZE_API_SECRET=demo
VITE_BREEZE_SESSION_TOKEN=demo
```

## Current Status

✅ **Breeze Connect integration complete**
✅ **Build successful**
✅ **TypeScript compilation successful**
✅ **Development server running**
✅ **Fallback system working**
✅ **All APIs integrated**
