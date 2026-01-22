import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import config from '../config';

// Custom error response interface
interface ErrorResponse {
  status: 'error';
  message: string;
  stack?: string;
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

// Global error handler
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle known operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  const response: ErrorResponse = {
    status: 'error',
    message,
  };

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
