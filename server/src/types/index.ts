// Database row types (matches schema)
export interface UserRow {
  id: string;
  cognito_sub: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PortfolioRow {
  id: string;
  user_id: string;
  name: string;
  starting_capital: string; // DECIMAL comes as string from pg
  cash_balance: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface HoldingRow {
  id: string;
  portfolio_id: string;
  ticker: string;
  shares: string;
  average_cost: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface TransactionRow {
  id: string;
  portfolio_id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: string;
  price_per_share: string;
  total_amount: string;
  executed_at: Date;
}

export interface WatchlistRow {
  id: string;
  user_id: string;
  ticker: string;
  added_at: Date;
  deleted_at: Date | null;
}

// API response types (formatted for frontend)
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  startingCapital: number;
  cashBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holding {
  id: string;
  portfolioId: string;
  ticker: string;
  shares: number;
  averageCost: number;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (added when we have price data)
  currentPrice?: number;
  marketValue?: number;
  totalGain?: number;
  totalGainPercent?: number;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  executedAt: Date;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  addedAt: Date;
  // Computed fields
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

// Request body types
export interface CreatePortfolioRequest {
  name: string;
  startingCapital: number;
}

export interface UpdatePortfolioRequest {
  name?: string;
}

export interface TradeRequest {
  ticker: string;
  shares: number;
  // price is fetched server-side, not provided by client
}

export interface AddToWatchlistRequest {
  ticker: string;
}

// Stock quote type (from Finnhub)
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

// API response wrapper
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
