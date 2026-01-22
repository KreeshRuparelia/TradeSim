import {
  ApiResponse,
  Portfolio,
  HoldingsResponse,
  Transaction,
  StockQuote,
  StockSearchResult,
  TradeResult,
  User,
} from '../types';
import { getIdToken, isCognitoConfigured } from './cognito';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (isCognitoConfigured()) {
    // Production: use Cognito token
    const token = getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    // Development fallback: use mock auth
    const userId = localStorage.getItem('tradesim_user_id');
    if (userId) {
      headers['X-User-Id'] = userId;
    }
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();
  
  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data.data as T;
}

// Auth (for development mode only)
export async function devLogin(username: string): Promise<User> {
  localStorage.setItem('tradesim_user_id', username);
  return getMe();
}

export async function devLogout(): Promise<void> {
  localStorage.removeItem('tradesim_user_id');
  localStorage.removeItem('tradesim_active_portfolio');
}

export async function getMe(): Promise<User> {
  const response = await fetch(`${API_BASE}/users/me`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User>(response);
}

// Portfolios
export async function getPortfolios(): Promise<Portfolio[]> {
  const response = await fetch(`${API_BASE}/portfolios`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Portfolio[]>(response);
}

export async function getPortfolio(id: string): Promise<Portfolio> {
  const response = await fetch(`${API_BASE}/portfolios/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Portfolio>(response);
}

export async function createPortfolio(name: string, startingCapital: number): Promise<Portfolio> {
  const response = await fetch(`${API_BASE}/portfolios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, startingCapital }),
  });
  return handleResponse<Portfolio>(response);
}

export async function updatePortfolio(id: string, name: string): Promise<Portfolio> {
  const response = await fetch(`${API_BASE}/portfolios/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse<Portfolio>(response);
}

export async function deletePortfolio(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/portfolios/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse<void>(response);
}

// Holdings
export async function getHoldings(portfolioId: string): Promise<HoldingsResponse> {
  const response = await fetch(`${API_BASE}/trades/portfolios/${portfolioId}/holdings`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<HoldingsResponse>(response);
}

// Transactions
export async function getTransactions(portfolioId: string, limit = 50): Promise<Transaction[]> {
  const response = await fetch(
    `${API_BASE}/trades/portfolios/${portfolioId}/transactions?limit=${limit}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<Transaction[]>(response);
}

// Trading
export async function buyStock(
  portfolioId: string,
  ticker: string,
  shares: number
): Promise<TradeResult> {
  const response = await fetch(`${API_BASE}/trades/portfolios/${portfolioId}/buy`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ticker, shares }),
  });
  return handleResponse<TradeResult>(response);
}

export async function sellStock(
  portfolioId: string,
  ticker: string,
  shares: number
): Promise<TradeResult> {
  const response = await fetch(`${API_BASE}/trades/portfolios/${portfolioId}/sell`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ticker, shares }),
  });
  return handleResponse<TradeResult>(response);
}

// Stocks
export async function getStockQuote(ticker: string): Promise<StockQuote> {
  const response = await fetch(`${API_BASE}/stocks/quote/${ticker}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<StockQuote>(response);
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const response = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<StockSearchResult[]>(response);
}