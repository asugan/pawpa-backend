import { NextFunction, Request, Response } from 'express';

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
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_SERVER_ERROR';

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
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details,
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
