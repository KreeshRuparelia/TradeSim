import { Router, Request, Response, NextFunction } from 'express';
import { getQuote, searchStocks } from '../services/stockService';
import { BadRequestError } from '../utils/errors';

const router = Router();

// Note: Stock routes don't require auth - public data

// Get a quote for a specific stock
router.get('/quote/:ticker', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker) {
      throw new BadRequestError('Ticker symbol is required');
    }

    const quote = await getQuote(ticker);

    res.json({
      status: 'success',
      data: quote,
    });
  } catch (error) {
    next(error);
  }
});

// Search for stocks by name or symbol
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new BadRequestError('Search query parameter "q" is required');
    }

    const results = await searchStocks(q);

    res.json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
