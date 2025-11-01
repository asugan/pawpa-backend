import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budgetService';
import { successResponse, errorResponse, getPaginationParams } from '../utils/response';
import { CreateBudgetLimitRequest, UpdateBudgetLimitRequest, BudgetQueryParams } from '../types/api';
import { BudgetLimit } from '../models/schema';
import { createError } from '../middleware/errorHandler';

export class BudgetController {
  private budgetService: BudgetService;

  constructor() {
    this.budgetService = new BudgetService();
  }

  // GET /api/pets/:petId/budget-limits - Get budget limits for a pet
  getBudgetLimitsByPetId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { petId } = req.params;
      const params: BudgetQueryParams = {
        ...getPaginationParams(req.query),
        period: req.query.period as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        category: req.query.category as string,
      };

      if (!petId) {
        throw createError('Pet ID is required', 400, 'MISSING_PET_ID');
      }

      const { budgetLimits, total } = await this.budgetService.getBudgetLimitsByPetId(petId, params);
      const meta = { total, page: params.page!, limit: params.limit!, totalPages: Math.ceil(total / params.limit!) };

      successResponse(res, budgetLimits, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/:id - Get budget limit by ID
  getBudgetLimitById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      const budgetLimit = await this.budgetService.getBudgetLimitById(id);

      if (!budgetLimit) {
        throw createError('Budget limit not found', 404, 'BUDGET_LIMIT_NOT_FOUND');
      }

      successResponse(res, budgetLimit);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/budget-limits - Create new budget limit
  createBudgetLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetData: CreateBudgetLimitRequest = req.body;

      // Validation
      if (!budgetData.petId || budgetData.amount === undefined || !budgetData.currency || !budgetData.period) {
        throw createError('Pet ID, amount, currency, and period are required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      if (budgetData.period !== 'monthly' && budgetData.period !== 'yearly') {
        throw createError('Period must be either "monthly" or "yearly"', 400, 'INVALID_PERIOD');
      }

      const budgetLimit = await this.budgetService.createBudgetLimit(budgetData);
      successResponse(res, budgetLimit, 201);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/budget-limits/:id - Update budget limit
  updateBudgetLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateBudgetLimitRequest = req.body;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      if (updates.period && updates.period !== 'monthly' && updates.period !== 'yearly') {
        throw createError('Period must be either "monthly" or "yearly"', 400, 'INVALID_PERIOD');
      }

      const budgetLimit = await this.budgetService.updateBudgetLimit(id, updates);

      if (!budgetLimit) {
        throw createError('Budget limit not found', 404, 'BUDGET_LIMIT_NOT_FOUND');
      }

      successResponse(res, budgetLimit);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/budget-limits/:id - Delete budget limit
  deleteBudgetLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      const deleted = await this.budgetService.deleteBudgetLimit(id);

      if (!deleted) {
        throw createError('Budget limit not found', 404, 'BUDGET_LIMIT_NOT_FOUND');
      }

      successResponse(res, { message: 'Budget limit deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/active - Get all active budget limits
  getActiveBudgetLimits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const budgetLimits = await this.budgetService.getActiveBudgetLimits(petId);
      successResponse(res, budgetLimits);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/alerts - Check budget alerts
  checkBudgetAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const alerts = await this.budgetService.checkBudgetAlerts(petId);
      successResponse(res, alerts);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/budget-limits/:id/status - Get budget status
  getBudgetStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Budget limit ID is required', 400, 'MISSING_ID');
      }

      const status = await this.budgetService.getBudgetStatus(id);

      if (!status) {
        throw createError('Budget limit not found', 404, 'BUDGET_LIMIT_NOT_FOUND');
      }

      successResponse(res, status);
    } catch (error) {
      next(error);
    }
  };
}
