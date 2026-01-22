import { Router } from 'express';
import healthRoutes from './health';
import userRoutes from './users';
import portfolioRoutes from './portfolios';
import stockRoutes from './stocks';
import tradeRoutes from './trades';

const router = Router();

// Health check (no auth required)
router.use('/health', healthRoutes);

// Stock data (no auth required - public data)
router.use('/stocks', stockRoutes);

// Protected routes (auth middleware is applied within each router)
router.use('/users', userRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/trades', tradeRoutes);

export default router;
