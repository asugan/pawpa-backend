import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, requireAuth, requireParam } from '../middleware/auth';
import { BudgetService } from '../services/budgetService';
import {
  getPaginationParams,
  successResponse,
} from '../utils/response';
import {
  BudgetQueryParams,
  CreateBudgetLimitRequest,
  UpdateBudgetLimitRequest,
} from '../types/api';
import { createError } from '../middleware/errorHandler';

export class BudgetController {
  private budgetService: BudgetService;

  constructor() {
    this.budgetService = new BudgetService();
  }

  // GET /api/pets/:petId/budget-limits - Get budget limits for a pet
  getBudgetLimitsByPetId = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const petId = requireParam(req.params.petId, 'petId');
      const params: BudgetQueryParams = {
        ...getPaginationParams(req.query),
        period: req.query.period as string,
        isActive:
          req.query.isActive === 'true'
            ? true
            : req.query.isActive === 'false'
              ? false
              : undefined,
        category: req.query.category as string,
      };

      if (!petId) {
        throw createError('Pet ID is required', 400, 'MISSING_PET_ID');
      }

      const { budgetLimits, total } =
        await this.budgetService.getBudgetLimitsByPetId(userId, petId, params);
      const meta = {
        total,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        totalPages: Math.ceil(total / (params.limit ?? 10)),
      };

      successResponse(res, budgetLimits, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/:id - Get budget limit by ID
  getBudgetLimitById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const { id } = req.params;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      const budgetLimit = await this.budgetService.getBudgetLimitById(
        userId,
        id
      );

      if (!budgetLimit) {
        throw createError(
          'Budget limit not found',
          404,
          'BUDGET_LIMIT_NOT_FOUND'
        );
      }

      successResponse(res, budgetLimit);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/budget-limits - Create new budget limit
  createBudgetLimit = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const budgetData = req.body as CreateBudgetLimitRequest;

      // Validation
      if (
        !budgetData.petId ||
        budgetData.amount === undefined ||
        !budgetData.currency ||
        !budgetData.period
      ) {
        throw createError(
          'Pet ID, amount, currency, and period are required',
          400,
          'MISSING_REQUIRED_FIELDS'
        );
      }

      if (budgetData.period !== 'monthly' && budgetData.period !== 'yearly') {
        throw createError(
          'Period must be either "monthly" or "yearly"',
          400,
          'INVALID_PERIOD'
        );
      }

      const budgetLimit = await this.budgetService.createBudgetLimit(
        userId,
        budgetData
      );
      successResponse(res, budgetLimit, 201);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/budget-limits/:id - Update budget limit
  updateBudgetLimit = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const { id } = req.params;
      const updates = req.body as UpdateBudgetLimitRequest;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      if (
        updates.period &&
        updates.period !== 'monthly' &&
        updates.period !== 'yearly'
      ) {
        throw createError(
          'Period must be either "monthly" or "yearly"',
          400,
          'INVALID_PERIOD'
        );
      }

      const budgetLimit = await this.budgetService.updateBudgetLimit(
        userId,
        id,
        updates
      );

      if (!budgetLimit) {
        throw createError(
          'Budget limit not found',
          404,
          'BUDGET_LIMIT_NOT_FOUND'
        );
      }

      successResponse(res, budgetLimit);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/budget-limits/:id - Delete budget limit
  deleteBudgetLimit = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const { id } = req.params;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      const deleted = await this.budgetService.deleteBudgetLimit(userId, id);

      if (!deleted) {
        throw createError(
          'Budget limit not found',
          404,
          'BUDGET_LIMIT_NOT_FOUND'
        );
      }

      successResponse(res, { message: 'Budget limit deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/active - Get all active budget limits
  getActiveBudgetLimits = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const petId = req.query.petId as string;
      const budgetLimits = await this.budgetService.getActiveBudgetLimits(
        userId,
        petId
      );
      successResponse(res, budgetLimits);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/alerts - Check budget alerts
  checkBudgetAlerts = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const petId = req.query.petId as string;
      const alerts = await this.budgetService.checkBudgetAlerts(userId, petId);
      successResponse(res, alerts);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/:id/status - Get budget status
  getBudgetStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const { id } = req.params;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      const status = await this.budgetService.getBudgetStatus(userId, id);

      if (!status) {
        throw createError(
          'Budget limit not found',
          404,
          'BUDGET_LIMIT_NOT_FOUND'
        );
      }

      successResponse(res, status);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/statuses - Get all budget statuses
  getAllBudgetStatuses = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const petId = req.query.petId as string;
      const statuses = await this.budgetService.getAllBudgetStatuses(
        userId,
        petId
      );
      successResponse(res, statuses);
    } catch (error) {
      next(error);
    }
  };
}
