import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Loader2, History } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { Transaction } from '../types';
import * as api from '../services/api';

export default function HistoryPage() {
  const { activePortfolio } = usePortfolio();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  useEffect(() => {
    if (!activePortfolio) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api
      .getTransactions(activePortfolio.id, 100)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activePortfolio]);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.type.toLowerCase() === filter;
  });

  if (!activePortfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No portfolio selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-500 mt-1">View all your past trades</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          {(['all', 'buy', 'sell'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'BUY'
                        ? 'bg-green-100 text-gain'
                        : 'bg-red-100 text-loss'
                    }`}
                  >
                    {transaction.type === 'BUY' ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {transaction.type === 'BUY' ? 'Bought' : 'Sold'} {transaction.ticker}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.shares.toFixed(4)} shares @ ${transaction.pricePerShare.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'BUY' ? 'text-loss' : 'text-gain'
                    }`}
                  >
                    {transaction.type === 'BUY' ? '-' : '+'}$
                    {transaction.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(transaction.executedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'Your transaction history will appear here once you make your first trade.'
                : `No ${filter} transactions found.`}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            label="Total Transactions"
            value={transactions.length.toString()}
          />
          <SummaryCard
            label="Total Bought"
            value={`$${transactions
              .filter((t) => t.type === 'BUY')
              .reduce((sum, t) => sum + t.totalAmount, 0)
              .toFixed(2)}`}
            valueColor="text-loss"
          />
          <SummaryCard
            label="Total Sold"
            value={`$${transactions
              .filter((t) => t.type === 'SELL')
              .reduce((sum, t) => sum + t.totalAmount, 0)
              .toFixed(2)}`}
            valueColor="text-gain"
          />
        </div>
      )}
    </div>
  );
}

function SummaryCard({
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
      <p className={`text-2xl font-display font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
