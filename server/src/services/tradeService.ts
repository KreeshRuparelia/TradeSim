import { query, transaction } from '../db';
import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionRow, PortfolioRow, HoldingRow } from '../types';
import { 
  NotFoundError, 
  BadRequestError, 
  InsufficientFundsError, 
  InsufficientSharesError 
} from '../utils/errors';
import { getQuote } from './stockService';

// Convert database row to API response format
function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    ticker: row.ticker,
    type: row.type,
    shares: parseFloat(row.shares),
    pricePerShare: parseFloat(row.price_per_share),
    totalAmount: parseFloat(row.total_amount),
    executedAt: row.executed_at,
  };
}

export interface TradeResult {
  transaction: Transaction;
  newCashBalance: number;
  holding: {
    ticker: string;
    shares: number;
    averageCost: number;
  } | null;
}

export async function buyStock(
  portfolioId: string,
  userId: string,
  ticker: string,
  shares: number
): Promise<TradeResult> {
  // Validate inputs
  if (shares <= 0) {
    throw new BadRequestError('Shares must be greater than 0');
  }

  const normalizedTicker = ticker.toUpperCase().trim();

  // Get current stock price
  const quote = await getQuote(normalizedTicker);
  const pricePerShare = quote.currentPrice;
  const totalCost = shares * pricePerShare;

  return transaction(async (client: PoolClient) => {
    // Get portfolio and verify ownership
    const portfolioResult = await client.query<PortfolioRow>(
      `SELECT * FROM portfolios 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       FOR UPDATE`,
      [portfolioId, userId]
    );

    if (portfolioResult.rows.length === 0) {
      throw new NotFoundError('Portfolio not found');
    }

    const portfolio = portfolioResult.rows[0];
    const currentCash = parseFloat(portfolio.cash_balance);

    // Check if user has enough cash
    if (currentCash < totalCost) {
      throw new InsufficientFundsError(
        `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${currentCash.toFixed(2)}`
      );
    }

    // Update or create holding
    const holdingResult = await client.query<HoldingRow>(
      `SELECT * FROM holdings 
       WHERE portfolio_id = $1 AND ticker = $2 AND deleted_at IS NULL
       FOR UPDATE`,
      [portfolioId, normalizedTicker]
    );

    let newShares: number;
    let newAverageCost: number;

    if (holdingResult.rows.length > 0) {
      // Update existing holding with weighted average cost
      const existing = holdingResult.rows[0];
      const existingShares = parseFloat(existing.shares);
      const existingCost = parseFloat(existing.average_cost);
      
      newShares = existingShares + shares;
      newAverageCost = ((existingShares * existingCost) + (shares * pricePerShare)) / newShares;

      await client.query(
        `UPDATE holdings SET shares = $1, average_cost = $2 WHERE id = $3`,
        [newShares, newAverageCost, existing.id]
      );
    } else {
      // Create new holding
      const holdingId = uuidv4();
      newShares = shares;
      newAverageCost = pricePerShare;

      await client.query(
        `INSERT INTO holdings (id, portfolio_id, ticker, shares, average_cost)
         VALUES ($1, $2, $3, $4, $5)`,
        [holdingId, portfolioId, normalizedTicker, newShares, newAverageCost]
      );
    }

    // Deduct cash from portfolio
    const newCashBalance = currentCash - totalCost;
    await client.query(
      `UPDATE portfolios SET cash_balance = $1 WHERE id = $2`,
      [newCashBalance, portfolioId]
    );

    // Record transaction
    const transactionId = uuidv4();
    const transactionResult = await client.query<TransactionRow>(
      `INSERT INTO transactions (id, portfolio_id, ticker, type, shares, price_per_share, total_amount)
       VALUES ($1, $2, $3, 'BUY', $4, $5, $6)
       RETURNING *`,
      [transactionId, portfolioId, normalizedTicker, shares, pricePerShare, totalCost]
    );

    return {
      transaction: toTransaction(transactionResult.rows[0]),
      newCashBalance,
      holding: {
        ticker: normalizedTicker,
        shares: newShares,
        averageCost: newAverageCost,
      },
    };
  });
}

export async function sellStock(
  portfolioId: string,
  userId: string,
  ticker: string,
  shares: number
): Promise<TradeResult> {
  // Validate inputs
  if (shares <= 0) {
    throw new BadRequestError('Shares must be greater than 0');
  }

  const normalizedTicker = ticker.toUpperCase().trim();

  // Get current stock price
  const quote = await getQuote(normalizedTicker);
  const pricePerShare = quote.currentPrice;
  const totalValue = shares * pricePerShare;

  return transaction(async (client: PoolClient) => {
    // Get portfolio and verify ownership
    const portfolioResult = await client.query<PortfolioRow>(
      `SELECT * FROM portfolios 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       FOR UPDATE`,
      [portfolioId, userId]
    );

    if (portfolioResult.rows.length === 0) {
      throw new NotFoundError('Portfolio not found');
    }

    const portfolio = portfolioResult.rows[0];
    const currentCash = parseFloat(portfolio.cash_balance);

    // Get holding
    const holdingResult = await client.query<HoldingRow>(
      `SELECT * FROM holdings 
       WHERE portfolio_id = $1 AND ticker = $2 AND deleted_at IS NULL
       FOR UPDATE`,
      [portfolioId, normalizedTicker]
    );

    if (holdingResult.rows.length === 0) {
      throw new NotFoundError(`You don't own any shares of ${normalizedTicker}`);
    }

    const holding = holdingResult.rows[0];
    const currentShares = parseFloat(holding.shares);

    // Check if user has enough shares
    if (currentShares < shares) {
      throw new InsufficientSharesError(
        `Insufficient shares. Requested: ${shares}, Available: ${currentShares}`
      );
    }

    // Update or delete holding
    const newShares = currentShares - shares;
    let holdingData: TradeResult['holding'] = null;

    if (newShares > 0.0001) { // Account for floating point precision
      await client.query(
        `UPDATE holdings SET shares = $1 WHERE id = $2`,
        [newShares, holding.id]
      );
      holdingData = {
        ticker: normalizedTicker,
        shares: newShares,
        averageCost: parseFloat(holding.average_cost),
      };
    } else {
      // Soft delete the holding if no shares remain
      await client.query(
        `UPDATE holdings SET deleted_at = NOW() WHERE id = $1`,
        [holding.id]
      );
    }

    // Add cash to portfolio
    const newCashBalance = currentCash + totalValue;
    await client.query(
      `UPDATE portfolios SET cash_balance = $1 WHERE id = $2`,
      [newCashBalance, portfolioId]
    );

    // Record transaction
    const transactionId = uuidv4();
    const transactionResult = await client.query<TransactionRow>(
      `INSERT INTO transactions (id, portfolio_id, ticker, type, shares, price_per_share, total_amount)
       VALUES ($1, $2, $3, 'SELL', $4, $5, $6)
       RETURNING *`,
      [transactionId, portfolioId, normalizedTicker, shares, pricePerShare, totalValue]
    );

    return {
      transaction: toTransaction(transactionResult.rows[0]),
      newCashBalance,
      holding: holdingData,
    };
  });
}

export async function getTransactionsByPortfolio(
  portfolioId: string,
  limit: number = 50
): Promise<Transaction[]> {
  const result = await query<TransactionRow>(
    `SELECT * FROM transactions 
     WHERE portfolio_id = $1
     ORDER BY executed_at DESC
     LIMIT $2`,
    [portfolioId, limit]
  );

  return result.rows.map(toTransaction);
}

export async function getTransactionById(
  transactionId: string,
  portfolioId: string
): Promise<Transaction> {
  const result = await query<TransactionRow>(
    `SELECT * FROM transactions 
     WHERE id = $1 AND portfolio_id = $2`,
    [transactionId, portfolioId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Transaction not found');
  }

  return toTransaction(result.rows[0]);
}
