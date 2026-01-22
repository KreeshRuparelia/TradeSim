import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Portfolio, HoldingsResponse } from '../types';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

interface PortfolioContextType {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  holdings: HoldingsResponse | null;
  isLoading: boolean;
  error: string | null;
  setActivePortfolio: (portfolio: Portfolio) => void;
  refreshPortfolios: () => Promise<void>;
  refreshHoldings: () => Promise<void>;
  createPortfolio: (name: string, startingCapital: number) => Promise<Portfolio>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolioState] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<HoldingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPortfolios = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPortfolios();
      setPortfolios(data);
      
      // Set active portfolio from storage or first available
      const storedId = localStorage.getItem('tradesim_active_portfolio');
      const active = data.find(p => p.id === storedId) || data[0] || null;
      if (active) {
        setActivePortfolioState(active);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolios');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshHoldings = useCallback(async () => {
    if (!activePortfolio) {
      setHoldings(null);
      return;
    }
    
    try {
      const data = await api.getHoldings(activePortfolio.id);
      setHoldings(data);
    } catch (err) {
      console.error('Failed to load holdings:', err);
    }
  }, [activePortfolio]);

  const setActivePortfolio = (portfolio: Portfolio) => {
    setActivePortfolioState(portfolio);
    localStorage.setItem('tradesim_active_portfolio', portfolio.id);
  };

  const createPortfolio = async (name: string, startingCapital: number): Promise<Portfolio> => {
    const portfolio = await api.createPortfolio(name, startingCapital);
    await refreshPortfolios();
    setActivePortfolio(portfolio);
    return portfolio;
  };

  // Load portfolios on auth change
  useEffect(() => {
    if (isAuthenticated) {
      refreshPortfolios();
    } else {
      setPortfolios([]);
      setActivePortfolioState(null);
      setHoldings(null);
    }
  }, [isAuthenticated, refreshPortfolios]);

  // Load holdings when active portfolio changes
  useEffect(() => {
    refreshHoldings();
  }, [activePortfolio, refreshHoldings]);

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        activePortfolio,
        holdings,
        isLoading,
        error,
        setActivePortfolio,
        refreshPortfolios,
        refreshHoldings,
        createPortfolio,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
