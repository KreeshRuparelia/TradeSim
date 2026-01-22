import { Router, Request, Response, NextFunction } from 'express';
import {
  createPortfolio,
  getPortfoliosByUser,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
} from '../services/portfolioService';
import { CreatePortfolioRequest, UpdatePortfolioRequest } from '../types';
import { BadRequestError } from '../utils/errors';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All portfolio routes require authentication
router.use(authMiddleware);

// Create a new portfolio
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, startingCapital } = req.body as CreatePortfolioRequest;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestError('Portfolio name is required');
    }

    if (!startingCapital || typeof startingCapital !== 'number' || startingCapital <= 0) {
      throw new BadRequestError('Starting capital must be a positive number');
    }

    if (startingCapital > 10000000) {
      throw new BadRequestError('Starting capital cannot exceed $10,000,000');
    }

    const portfolio = await createPortfolio(req.user!.id, {
      name: name.trim(),
      startingCapital,
    });

    res.status(201).json({
      status: 'success',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
});

// Get all portfolios for the authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolios = await getPortfoliosByUser(req.user!.id);

    res.json({
      status: 'success',
      data: portfolios,
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific portfolio by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await getPortfolioById(req.params.id, req.user!.id);

    res.json({
      status: 'success',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
});

// Update a portfolio
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body as UpdatePortfolioRequest;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      throw new BadRequestError('Portfolio name cannot be empty');
    }

    const portfolio = await updatePortfolio(req.params.id, req.user!.id, {
      name: name?.trim(),
    });

    res.json({
      status: 'success',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
});

// Delete a portfolio (soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deletePortfolio(req.params.id, req.user!.id);

    res.json({
      status: 'success',
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
