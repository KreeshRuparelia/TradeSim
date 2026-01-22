import { query, transaction } from '../db';
import { v4 as uuidv4 } from 'uuid';
import {
  Portfolio,
  PortfolioRow,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
} from '../types';
import { NotFoundError } from '../utils/errors';

// Convert database row to API response format
function toPortfolio(row: PortfolioRow): Portfolio {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    startingCapital: parseFloat(row.starting_capital),
    cashBalance: parseFloat(row.cash_balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createPortfolio(
  userId: string,
  data: CreatePortfolioRequest
): Promise<Portfolio> {
  const id = uuidv4();

  const result = await query<PortfolioRow>(
    `INSERT INTO portfolios (id, user_id, name, starting_capital, cash_balance)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING *`,
    [id, userId, data.name, data.startingCapital]
  );

  return toPortfolio(result.rows[0]);
}

export async function getPortfoliosByUser(userId: string): Promise<Portfolio[]> {
  const result = await query<PortfolioRow>(
    `SELECT * FROM portfolios 
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows.map(toPortfolio);
}

export async function getPortfolioById(
  portfolioId: string,
  userId: string
): Promise<Portfolio> {
  const result = await query<PortfolioRow>(
    `SELECT * FROM portfolios 
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [portfolioId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Portfolio not found');
  }

  return toPortfolio(result.rows[0]);
}

export async function updatePortfolio(
  portfolioId: string,
  userId: string,
  data: UpdatePortfolioRequest
): Promise<Portfolio> {
  // First check if portfolio exists and belongs to user
  await getPortfolioById(portfolioId, userId);

  const result = await query<PortfolioRow>(
    `UPDATE portfolios 
     SET name = COALESCE($1, name)
     WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [data.name, portfolioId, userId]
  );

  return toPortfolio(result.rows[0]);
}

export async function deletePortfolio(
  portfolioId: string,
  userId: string
): Promise<void> {
  // First check if portfolio exists and belongs to user
  await getPortfolioById(portfolioId, userId);

  // Soft delete
  await query(
    `UPDATE portfolios 
     SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [portfolioId, userId]
  );
}

// Internal function for trading - updates cash balance
export async function updateCashBalance(
  portfolioId: string,
  newBalance: number
): Promise<void> {
  await query(
    `UPDATE portfolios SET cash_balance = $1 WHERE id = $2`,
    [newBalance, portfolioId]
  );
}

// Get portfolio with current value calculation (used internally)
export async function getPortfolioWithValue(
  portfolioId: string,
  userId: string
): Promise<Portfolio & { totalValue?: number }> {
  const portfolio = await getPortfolioById(portfolioId, userId);
  // Total value calculation will be added when we integrate holdings + stock prices
  return portfolio;
}
