import { Response } from 'express';
import { ParsedQs } from 'qs';
import { ApiResponse, PaginationMeta } from '../types/api';

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response => {
  const error: { code: string; message: string; details?: unknown } = {
    code,
    message,
  };

  if (details !== undefined && details !== null) {
    error.details = details;
  }

  const response: ApiResponse<unknown> = {
    success: false,
    error,
  };
  return res.status(statusCode).json(response);
};

export const calculatePagination = (
  total: number,
  page = 1,
  limit = 10
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
  };
};

export const getPaginationParams = (
  query: ParsedQs
): { page: number; limit: number; offset: number } => {
  const page = Math.max(1, parseInt(query.page as string) ?? 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) ?? 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};
