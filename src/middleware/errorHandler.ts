import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

export interface ApiError extends Error {
  statusCode: number;
  code: string | undefined;
  details: unknown;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode ?? 500;
  let code = err.code ?? 'INTERNAL_SERVER_ERROR';
  let message = err.message;
  let details: unknown = err.details;

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
  }

  // MongoDB duplicate key error (code 11000)
  else if ((err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    message = 'Duplicate key error';
    const field = Object.keys((err as any).keyValue)[0];
    details = {
      field,
      value: (err as any).keyValue[field],
      message: `${field} already exists`,
    };
  }

  // Invalid ObjectId
  else if (err.kind === 'ObjectId' || err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID_FORMAT';
    message = 'Invalid ID format';
    details = {
      value: (err as any).value,
      message: 'ID must be a valid 24-character hex string',
    };
  }

  // MongoDB connection error
  else if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
    statusCode = 500;
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Database connection error';
    details = {
      message: 'Unable to connect to the database. Please try again later.',
    };
  }

  // MongoDB timeout errors
  else if (err.name === 'MongooseTimeoutError') {
    statusCode = 504;
    code = 'DATABASE_TIMEOUT';
    message = 'Database operation timed out';
    details = {
      message: 'The database operation took too long to complete. Please try again.',
    };
  }

  // Write conflict errors
  else if ((err as any).code === 112) {
    statusCode = 409;
    code = 'WRITE_CONFLICT';
    message = 'Write conflict detected';
    details = {
      message: 'Multiple users attempted to modify the same data. Please refresh and try again.',
    };
  }

  // eslint-disable-next-line no-console
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details,
      }),
    },
  });
};

export const createError = (
  message: string,
  statusCode = 500,
  code?: string,
  details?: unknown
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};
