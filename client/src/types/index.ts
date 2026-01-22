// API Response wrapper
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// User
export interface User {
  id: string;
  email: string;
  createdAt: string;
  portfolioCount?: number;
}

// Portfolio
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  startingCapital: number;
  cashBalance: number;
  createdAt: string;
  updatedAt: string;
}

// Holding
export interface Holding {
  id: string;
  portfolioId: string;
  ticker: string;
  shares: number;
  averageCost: number;
  createdAt: string;
  updatedAt: string;
  currentPrice: number;
  marketValue: number;
  totalGain: number;
  totalGainPercent: number;
}

// Holdings response with summary
export interface HoldingsResponse {
  holdings: Holding[];
  summary: {
    totalMarketValue: number;
    totalCostBasis: number;
    totalGain: number;
    totalGainPercent: number;
  };
}

// Transaction
export interface Transaction {
  id: string;
  portfolioId: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  executedAt: string;
}

// Stock Quote
export interface StockQuote {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  timestamp: number;
}

// Stock Search Result
export interface StockSearchResult {
  symbol: string;
  description: string;
  type: string;
}

// Trade result
export interface TradeResult {
  transaction: Transaction;
  newCashBalance: number;
  holding: {
    ticker: string;
    shares: number;
    averageCost: number;
  } | null;
}

// News Article (Marketaux)
export interface NewsArticle {
  uuid: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  published_at: string;
  source: string;
  relevance_score?: number;
}

// Auth context
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}
