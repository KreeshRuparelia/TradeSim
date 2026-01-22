import { Router, Request, Response } from 'express';
import { checkConnection } from '../db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const dbHealthy = await checkConnection();

  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
    },
  };

  const statusCode = dbHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
