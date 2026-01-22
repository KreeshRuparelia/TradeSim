import { Router, Request, Response, NextFunction } from 'express';
import { buyStock, sellStock, getTransactionsByPortfolio } from '../services/tradeService';
import { getHoldingsByPortfolioWithQuotes } from '../services/holdingsService';
import { getPortfolioById } from '../services/portfolioService';
import { TradeRequest } from '../types';
import { BadRequestError } from '../utils/errors';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All trade routes require authentication
router.use(authMiddleware);

// Buy stock
router.post(
  '/portfolios/:portfolioId/buy',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { portfolioId } = req.params;
      const { ticker, shares } = req.body as TradeRequest;

      // Validation
      if (!ticker || typeof ticker !== 'string') {
        throw new BadRequestError('Ticker symbol is required');
      }

      if (!shares || typeof shares !== 'number' || shares <= 0) {
        throw new BadRequestError('Shares must be a positive number');
      }

      const result = await buyStock(portfolioId, req.user!.id, ticker, shares);

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Sell stock
router.post(
  '/portfolios/:portfolioId/sell',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { portfolioId } = req.params;
      const { ticker, shares } = req.body as TradeRequest;

      // Validation
      if (!ticker || typeof ticker !== 'string') {
        throw new BadRequestError('Ticker symbol is required');
      }

      if (!shares || typeof shares !== 'number' || shares <= 0) {
        throw new BadRequestError('Shares must be a positive number');
      }

      const result = await sellStock(portfolioId, req.user!.id, ticker, shares);

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get holdings for a portfolio (with current prices and gains)
router.get(
  '/portfolios/:portfolioId/holdings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { portfolioId } = req.params;

      // Verify portfolio ownership
      await getPortfolioById(portfolioId, req.user!.id);

      const holdings = await getHoldingsByPortfolioWithQuotes(portfolioId);

      // Calculate totals
      const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
      const totalGain = holdings.reduce((sum, h) => sum + h.totalGain, 0);
      const totalCostBasis = holdings.reduce((sum, h) => sum + (h.shares * h.averageCost), 0);
      const totalGainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

      res.json({
        status: 'success',
        data: {
          holdings,
          summary: {
            totalMarketValue,
            totalCostBasis,
            totalGain,
            totalGainPercent,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get transaction history for a portfolio
router.get(
  '/portfolios/:portfolioId/transactions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { portfolioId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      // Verify portfolio ownership
      await getPortfolioById(portfolioId, req.user!.id);

      const transactions = await getTransactionsByPortfolio(portfolioId, limit);

      res.json({
        status: 'success',
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
