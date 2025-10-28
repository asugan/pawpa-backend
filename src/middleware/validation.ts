import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from './errorHandler';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);

      // Replace the request data with validated data
      req[source] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        next(createError('Validation failed', 400, 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
};

// Alias for backward compatibility
export const validateRequest = validate;