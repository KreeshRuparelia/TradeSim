import { Router, Request, Response, NextFunction } from 'express';
import { getUserById } from '../services/userService';
import { getPortfoliosByUser } from '../services/portfolioService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Get current user profile
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.id);
    const portfolios = await getPortfoliosByUser(req.user!.id);

    res.json({
      status: 'success',
      data: {
        ...user,
        portfolioCount: portfolios.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
