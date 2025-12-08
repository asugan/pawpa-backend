import { NextFunction, Request, Response } from 'express';
import { dateJSONReplacer } from '../lib/dateUtils';

/**
 * Middleware to ensure all Date objects in responses are serialized as UTC ISO strings
 * This prevents timezone inconsistencies in API responses
 */
export const utcDateSerializer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store the original json method
  const originalJson = res.json;

  // Override the json method
  res.json = function (data: unknown) {
    // Stringify with our custom replacer that normalizes dates to UTC
    const jsonString = JSON.stringify(data, dateJSONReplacer);

    // Parse it back to maintain same format as original
    const parsedData = JSON.parse(jsonString) as unknown;

    // Call the original json method with normalized data
    return originalJson.call(this, parsedData);
  };

  next();
};
