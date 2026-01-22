import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Holding, HoldingRow } from '../types';
import { NotFoundError } from '../utils/errors';
import { getQuote, getMultipleQuotes } from './stockService';

// Convert database row to API response format
function toHolding(row: HoldingRow): Holding {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    ticker: row.ticker,
    shares: parseFloat(row.shares),
    averageCost: parseFloat(row.average_cost),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getHoldingsByPortfolio(portfolioId: string): Promise<Holding[]> {
  const result = await query<HoldingRow>(
    `SELECT * FROM holdings 
     WHERE portfolio_id = $1 AND deleted_at IS NULL
     ORDER BY ticker ASC`,
    [portfolioId]
  );

  return result.rows.map(toHolding);
}

export async function getHoldingsByPortfolioWithQuotes(
  portfolioId: string
): Promise<(Holding & { currentPrice: number; marketValue: number; totalGain: number; totalGainPercent: number })[]> {
  const holdings = await getHoldingsByPortfolio(portfolioId);
  
  if (holdings.length === 0) {
    return [];
  }

  // Fetch all quotes
  const tickers = holdings.map(h => h.ticker);
  const quotes = await getMultipleQuotes(tickers);

  return holdings.map(holding => {
    const quote = quotes.get(holding.ticker);
    const currentPrice = quote?.currentPrice ?? holding.averageCost;
    const marketValue = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.averageCost;
    const totalGain = marketValue - costBasis;
    const totalGainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;

    return {
      ...holding,
      currentPrice,
      marketValue,
      totalGain,
      totalGainPercent,
    };
  });
}

export async function getHolding(
  portfolioId: string,
  ticker: string
): Promise<Holding | null> {
  const result = await query<HoldingRow>(
    `SELECT * FROM holdings 
     WHERE portfolio_id = $1 AND ticker = $2 AND deleted_at IS NULL`,
    [portfolioId, ticker.toUpperCase()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return toHolding(result.rows[0]);
}

export async function createHolding(
  portfolioId: string,
  ticker: string,
  shares: number,
  averageCost: number
): Promise<Holding> {
  const id = uuidv4();

  const result = await query<HoldingRow>(
    `INSERT INTO holdings (id, portfolio_id, ticker, shares, average_cost)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, portfolioId, ticker.toUpperCase(), shares, averageCost]
  );

  return toHolding(result.rows[0]);
}

export async function updateHolding(
  holdingId: string,
  shares: number,
  averageCost: number
): Promise<Holding> {
  const result = await query<HoldingRow>(
    `UPDATE holdings 
     SET shares = $1, average_cost = $2
     WHERE id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [shares, averageCost, holdingId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Holding not found');
  }

  return toHolding(result.rows[0]);
}

export async function deleteHolding(holdingId: string): Promise<void> {
  await query(
    `UPDATE holdings SET deleted_at = NOW() WHERE id = $1`,
    [holdingId]
  );
}
