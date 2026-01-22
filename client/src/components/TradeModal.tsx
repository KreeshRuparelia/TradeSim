import React, { useState, useEffect } from 'react';
import { X, Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import * as api from '../services/api';
import { StockQuote, StockSearchResult } from '../types';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'buy' | 'sell';
  preselectedTicker?: string;
  maxShares?: number;
}

export default function TradeModal({
  isOpen,
  onClose,
  mode,
  preselectedTicker,
  maxShares,
}: TradeModalProps) {
  const { activePortfolio, refreshHoldings, refreshPortfolios } = usePortfolio();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedTicker, setSelectedTicker] = useState(preselectedTicker || '');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  const [shares, setShares] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTicker(preselectedTicker || '');
      setShares('');
      setError('');
      setSuccess('');
      setSearchQuery('');
      setSearchResults([]);
      if (preselectedTicker) {
        loadQuote(preselectedTicker);
      }
    }
  }, [isOpen, preselectedTicker]);

  // Search stocks
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchStocks(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadQuote = async (ticker: string) => {
    setIsLoadingQuote(true);
    setError('');
    try {
      const data = await api.getStockQuote(ticker);
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quote');
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const selectStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchQuery('');
    setSearchResults([]);
    loadQuote(ticker);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortfolio || !selectedTicker || !shares) return;

    const shareCount = parseFloat(shares);
    if (isNaN(shareCount) || shareCount <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    if (mode === 'sell' && maxShares && shareCount > maxShares) {
      setError(`You can only sell up to ${maxShares} shares`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'buy') {
        await api.buyStock(activePortfolio.id, selectedTicker, shareCount);
      } else {
        await api.sellStock(activePortfolio.id, selectedTicker, shareCount);
      }
      
      setSuccess(`Successfully ${mode === 'buy' ? 'bought' : 'sold'} ${shareCount} shares of ${selectedTicker}`);
      
      // Refresh data
      await Promise.all([refreshHoldings(), refreshPortfolios()]);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedTotal = quote && shares ? quote.currentPrice * parseFloat(shares) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-display font-bold text-gray-900">
            {mode === 'buy' ? 'Buy Stock' : 'Sell Stock'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Stock Search (only for buy mode without preselected ticker) */}
          {mode === 'buy' && !preselectedTicker && (
            <div>
              <label className="label">Search Stock</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or symbol..."
                  className="input pl-11"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      type="button"
                      onClick={() => selectStock(result.symbol)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <span className="font-semibold text-gray-900">{result.symbol}</span>
                      <span className="ml-2 text-sm text-gray-500">{result.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Stock / Quote Display */}
          {selectedTicker && (
            <div className="bg-gray-50 rounded-xl p-4">
              {isLoadingQuote ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                </div>
              ) : quote ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{quote.ticker}</p>
                    <p className="text-2xl font-display font-bold text-gray-900">
                      ${quote.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                      quote.change >= 0 ? 'bg-green-100 text-gain' : 'bg-red-100 text-loss'
                    }`}
                  >
                    {quote.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-semibold">
                      {quote.change >= 0 ? '+' : ''}
                      {quote.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Shares Input */}
          {selectedTicker && quote && (
            <>
              <div>
                <label className="label">
                  Number of Shares
                  {mode === 'sell' && maxShares && (
                    <span className="text-gray-400 font-normal ml-2">
                      (Max: {maxShares})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                  className="input text-lg"
                />
              </div>

              {/* Estimated Total */}
              {estimatedTotal > 0 && (
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <span className="text-gray-600">Estimated Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${estimatedTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Available Cash (for buy mode) */}
              {mode === 'buy' && activePortfolio && (
                <p className="text-sm text-gray-500">
                  Available Cash:{' '}
                  <span className="font-semibold text-gray-700">
                    ${activePortfolio.cashBalance.toFixed(2)}
                  </span>
                </p>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedTicker || !shares || isSubmitting || !!success}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
              mode === 'buy'
                ? 'bg-brand-500 hover:bg-brand-600 text-white disabled:bg-gray-200 disabled:text-gray-400'
                : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-200 disabled:text-gray-400'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              `${mode === 'buy' ? 'Buy' : 'Sell'} ${selectedTicker || 'Stock'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
