import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart,
  Loader2,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import TradeModal from '../components/TradeModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activePortfolio, holdings, isLoading } = usePortfolio();
  const [tradeModal, setTradeModal] = useState<{
    isOpen: boolean;
    mode: 'buy' | 'sell';
    ticker?: string;
    maxShares?: number;
  }>({ isOpen: false, mode: 'buy' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!activePortfolio) {
    return <NoPortfolioState />;
  }

  const totalValue = holdings
    ? holdings.summary.totalMarketValue + activePortfolio.cashBalance
    : activePortfolio.cashBalance;
  
  const totalGain = holdings
    ? totalValue - activePortfolio.startingCapital
    : 0;
  
  const totalGainPercent = activePortfolio.startingCapital > 0
    ? (totalGain / activePortfolio.startingCapital) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your portfolio overview.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setTradeModal({ isOpen: true, mode: 'buy' })}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buy Stock
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Value */}
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total Portfolio Value</span>
            <div className="p-2 bg-brand-50 rounded-lg">
              <PieChart className="w-4 h-4 text-brand-600" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-gray-900">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center gap-1 mt-2 ${totalGain >= 0 ? 'text-gain' : 'text-loss'}`}>
            {totalGain >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">
              {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)} ({totalGainPercent.toFixed(2)}%)
            </span>
            <span className="text-xs text-gray-400 ml-1">all time</span>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="card animate-fade-in stagger-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Cash Available</span>
            <div className="p-2 bg-green-50 rounded-lg">
              <Wallet className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-gray-900">
            ${activePortfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Ready to invest
          </p>
        </div>

        {/* Invested Value */}
        <div className="card animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Invested Value</span>
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-gray-900">
            ${(holdings?.summary.totalMarketValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Across {holdings?.holdings.length || 0} stocks
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold text-gray-900">Your Holdings</h2>
          <button
            onClick={() => navigate('/portfolio')}
            className="text-sm text-brand-600 font-medium hover:text-brand-700"
          >
            View All →
          </button>
        </div>

        {holdings && holdings.holdings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Gain/Loss
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {holdings.holdings.map((holding, index) => (
                  <tr
                    key={holding.id}
                    className="hover:bg-gray-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            {holding.ticker.slice(0, 2)}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">{holding.ticker}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600">
                      {holding.shares.toFixed(4)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      ${holding.currentPrice.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900">
                      ${holding.marketValue.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${
                          holding.totalGain >= 0
                            ? 'bg-green-50 text-gain'
                            : 'bg-red-50 text-loss'
                        }`}
                      >
                        {holding.totalGain >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-sm font-semibold">
                          {holding.totalGain >= 0 ? '+' : ''}
                          {holding.totalGainPercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() =>
                          setTradeModal({
                            isOpen: true,
                            mode: 'sell',
                            ticker: holding.ticker,
                            maxShares: holding.shares,
                          })
                        }
                        className="text-sm text-red-600 font-medium hover:text-red-700"
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No holdings yet</h3>
            <p className="text-gray-500 mb-4">Start building your portfolio by buying your first stock.</p>
            <button
              onClick={() => setTradeModal({ isOpen: true, mode: 'buy' })}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buy Your First Stock
            </button>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <TradeModal
        isOpen={tradeModal.isOpen}
        onClose={() => setTradeModal({ isOpen: false, mode: 'buy' })}
        mode={tradeModal.mode}
        preselectedTicker={tradeModal.ticker}
        maxShares={tradeModal.maxShares}
      />
    </div>
  );
}

function NoPortfolioState() {
  const navigate = useNavigate();
  const { createPortfolio } = usePortfolio();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePortfolio = async () => {
    setIsCreating(true);
    try {
      await createPortfolio('My Portfolio', 10000);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <PieChart className="w-10 h-10 text-brand-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Create Your First Portfolio
        </h2>
        <p className="text-gray-500 mb-6">
          Get started with $10,000 in virtual cash to practice trading stocks without any risk.
        </p>
        <button
          onClick={handleCreatePortfolio}
          disabled={isCreating}
          className="btn-primary px-8 py-3"
        >
          {isCreating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Create Portfolio
            </>
          )}
        </button>
      </div>
    </div>
  );
}
