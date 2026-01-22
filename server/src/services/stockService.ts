import config from '../config';
import { StockQuote } from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';

// In-memory cache for stock quotes
interface CacheEntry {
  quote: StockQuote;
  cachedAt: number;
}

const quoteCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Finnhub API response type
interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

async function fetchFromFinnhub(endpoint: string): Promise<unknown> {
  const apiKey = config.finnhub.apiKey;
  
  if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
    throw new BadRequestError('Finnhub API key not configured');
  }

  const url = `https://finnhub.io/api/v1${endpoint}&token=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 429) {
      throw new BadRequestError('API rate limit exceeded. Please try again later.');
    }
    throw new BadRequestError(`Finnhub API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getQuote(ticker: string): Promise<StockQuote> {
  const normalizedTicker = ticker.toUpperCase().trim();
  
  // Validate ticker format (basic validation)
  if (!/^[A-Z]{1,5}$/.test(normalizedTicker)) {
    throw new BadRequestError('Invalid ticker symbol');
  }

  // Check cache first
  const cached = quoteCache.get(normalizedTicker);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.quote;
  }

  // Fetch from Finnhub
  const data = await fetchFromFinnhub(`/quote?symbol=${normalizedTicker}`) as FinnhubQuote;

  // Finnhub returns zeros for invalid symbols
  if (data.c === 0 && data.pc === 0) {
    throw new NotFoundError(`Stock symbol '${normalizedTicker}' not found`);
  }

  const quote: StockQuote = {
    ticker: normalizedTicker,
    currentPrice: data.c,
    change: data.d,
    changePercent: data.dp,
    highPrice: data.h,
    lowPrice: data.l,
    openPrice: data.o,
    previousClose: data.pc,
    timestamp: data.t,
  };

  // Update cache
  quoteCache.set(normalizedTicker, {
    quote,
    cachedAt: Date.now(),
  });

  return quote;
}

export async function getMultipleQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  
  // Fetch all quotes (could be optimized with Promise.all, but respecting rate limits)
  for (const ticker of tickers) {
    try {
      const quote = await getQuote(ticker);
      results.set(ticker.toUpperCase(), quote);
    } catch (error) {
      // Skip failed quotes, don't fail the entire request
      console.error(`Failed to fetch quote for ${ticker}:`, error);
    }
  }

  return results;
}

// Search for stock symbols
interface FinnhubSearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export interface StockSearchResult {
  symbol: string;
  description: string;
  type: string;
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new BadRequestError('Search query is required');
  }

  const data = await fetchFromFinnhub(`/search?q=${encodeURIComponent(query)}`) as FinnhubSearchResult;

  // Filter to common stock types and US exchanges
  return data.result
    .filter(item => item.type === 'Common Stock')
    .slice(0, 10) // Limit results
    .map(item => ({
      symbol: item.symbol,
      description: item.description,
      type: item.type,
    }));
}

// Get cached quote if available (for internal use)
export function getCachedQuote(ticker: string): StockQuote | null {
  const cached = quoteCache.get(ticker.toUpperCase());
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.quote;
  }
  return null;
}

// Clear cache (for testing)
export function clearCache(): void {
  quoteCache.clear();
}
