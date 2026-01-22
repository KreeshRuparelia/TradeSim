import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  Trash2,
  Loader2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import TradeModal from '../components/TradeModal';
import * as api from '../services/api';

export default function PortfolioPage() {
  const { activePortfolio, holdings, isLoading, refreshPortfolios } = usePortfolio();
  const [tradeModal, setTradeModal] = useState<{
    isOpen: boolean;
    mode: 'buy' | 'sell';
    ticker?: string;
    maxShares?: number;
  }>({ isOpen: false, mode: 'buy' });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!activePortfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No portfolio selected. Create one from the dashboard.</p>
      </div>
    );
  }

  const totalValue = holdings
    ? holdings.summary.totalMarketValue + activePortfolio.cashBalance
    : activePortfolio.cashBalance;

  const handleStartEdit = () => {
    setEditName(activePortfolio.name);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await api.updatePortfolio(activePortfolio.id, editName.trim());
      await refreshPortfolios();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-display font-bold text-gray-900 bg-gray-100 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                  {activePortfolio.name}
                </h1>
                <button
                  onClick={handleStartEdit}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-gray-500">
            Created {new Date(activePortfolio.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setTradeModal({ isOpen: true, mode: 'buy' })}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buy Stock
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Value"
          value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          label="Cash Balance"
          value={`$${activePortfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          label="Starting Capital"
          value={`$${activePortfolio.startingCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          label="Total Gain/Loss"
          value={`${(holdings?.summary.totalGain ?? 0) >= 0 ? '+' : ''}$${(holdings?.summary.totalGain || 0).toFixed(2)}`}
          valueColor={
            (holdings?.summary.totalGain ?? 0) >= 0
              ? 'text-gain'
              : 'text-loss'
          }
        />
      </div>

      {/* Holdings */}
      <div className="card">
        <h2 className="text-lg font-display font-bold text-gray-900 mb-6">Holdings</h2>

        {holdings && holdings.holdings.length > 0 ? (
          <div className="space-y-4">
            {holdings.holdings.map((holding, index) => (
              <div
                key={holding.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-lg font-bold text-gray-700">
                      {holding.ticker.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{holding.ticker}</p>
                    <p className="text-sm text-gray-500">
                      {holding.shares.toFixed(4)} shares @ ${holding.averageCost.toFixed(2)} avg
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${holding.marketValue.toFixed(2)}
                    </p>
                    <div
                      className={`flex items-center justify-end gap-1 text-sm ${
                        holding.totalGain >= 0 ? 'text-gain' : 'text-loss'
                      }`}
                    >
                      {holding.totalGain >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="font-medium">
                        {holding.totalGain >= 0 ? '+' : ''}
                        ${holding.totalGain.toFixed(2)} ({holding.totalGainPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setTradeModal({
                          isOpen: true,
                          mode: 'buy',
                          ticker: holding.ticker,
                        })
                      }
                      className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() =>
                        setTradeModal({
                          isOpen: true,
                          mode: 'sell',
                          ticker: holding.ticker,
                          maxShares: holding.shares,
                        })
                      }
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No holdings in this portfolio yet.</p>
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

function StatCard({
  label,
  value,
  valueColor = 'text-gray-900',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-display font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}