import { z } from 'zod';

// Validate MongoDB ObjectId format (24 hex characters)
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Common validation schemas for route parameters
export const paramsWithId = z.object({
  id: objectIdSchema,
});

export const paramsWithPetId = z.object({
  petId: objectIdSchema,
});

export const paramsWithUserId = z.object({
  userId: objectIdSchema,
});

// Validation middleware factory for ObjectId params
import { Request, Response, NextFunction } from 'express';

export function validateObjectId(param: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[param];

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          message: `${param} parameter is required`,
          code: 'MISSING_PARAM'
        }
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid ${param} format`,
          code: 'INVALID_ID_FORMAT'
        }
      });
    }

    next();
  };
}