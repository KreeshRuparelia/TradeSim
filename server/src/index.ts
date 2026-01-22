import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { closePool } from './db';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.nodeEnv === 'development' 
      ? '*' 
      : [
          'https://dqzod4lh9g28k.cloudfront.net',
          'http://tradesim-frontend-kreesh.s3-website.ca-central-1.amazonaws.com'
        ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Stock Simulator API',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`
🚀 Stock Simulator API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: ${config.nodeEnv}
Port:        ${config.port}
Health:      http://localhost:${config.port}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    await closePool();
    console.log('Database pool closed.');
    
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;