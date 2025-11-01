import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expenseService';
import { successResponse, errorResponse, getPaginationParams } from '../utils/response';
import { CreateExpenseRequest, UpdateExpenseRequest, ExpenseQueryParams } from '../types/api';
import { Expense } from '../models/schema';
import { createError } from '../middleware/errorHandler';

export class ExpenseController {
  private expenseService: ExpenseService;

  constructor() {
    this.expenseService = new ExpenseService();
  }

  // GET /api/pets/:petId/expenses - Get expenses for a pet
  getExpensesByPetId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { petId } = req.params;
      const params: ExpenseQueryParams = {
        ...getPaginationParams(req.query),
        category: req.query.category as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        currency: req.query.currency as string,
        paymentMethod: req.query.paymentMethod as string,
      };

      if (!petId) {
        throw createError('Pet ID is required', 400, 'MISSING_PET_ID');
      }

      const { expenses, total } = await this.expenseService.getExpensesByPetId(petId, params);
      const meta = { total, page: params.page!, limit: params.limit!, totalPages: Math.ceil(total / params.limit!) };

      successResponse(res, expenses, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/:id - Get expense by ID
  getExpenseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Expense ID is required', 400, 'MISSING_ID');
      }

      const expense = await this.expenseService.getExpenseById(id);

      if (!expense) {
        throw createError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
      }

      successResponse(res, expense);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/expenses - Create new expense
  createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expenseData: CreateExpenseRequest = req.body;

      // Validation
      if (!expenseData.petId || !expenseData.category || expenseData.amount === undefined || !expenseData.currency || !expenseData.date) {
        throw createError('Pet ID, category, amount, currency, and date are required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      // Convert date string to Date object
      const expense = await this.expenseService.createExpense({
        ...expenseData,
        date: new Date(expenseData.date),
      });

      successResponse(res, expense, 201);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/expenses/:id - Update expense
  updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateExpenseRequest = req.body;

      if (!id) {
        throw createError('Expense ID is required', 400, 'MISSING_ID');
      }

      // Convert date string to Date object if provided
      const updateData: any = { ...updates };
      if (updates.date) {
        updateData.date = new Date(updates.date);
      }

      const expense = await this.expenseService.updateExpense(id, updateData);

      if (!expense) {
        throw createError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
      }

      successResponse(res, expense);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/expenses/:id - Delete expense
  deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Expense ID is required', 400, 'MISSING_ID');
      }

      const deleted = await this.expenseService.deleteExpense(id);

      if (!deleted) {
        throw createError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
      }

      successResponse(res, { message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/stats - Get expense statistics
  getExpenseStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const category = req.query.category as string;

      const stats = await this.expenseService.getExpenseStats(petId, startDate, endDate, category);
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/by-date - Get expenses by date range
  getExpensesByDateRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      if (!startDate || !endDate) {
        throw createError('Start date and end date are required', 400, 'MISSING_DATE_RANGE');
      }

      const expenses = await this.expenseService.getExpensesByDateRange(petId, startDate, endDate);
      successResponse(res, expenses);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/monthly - Get monthly expenses
  getMonthlyExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month !== undefined ? parseInt(req.query.month as string) : undefined;

      const expenses = await this.expenseService.getMonthlyExpenses(petId, year, month);
      successResponse(res, expenses);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/yearly - Get yearly expenses
  getYearlyExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      const expenses = await this.expenseService.getYearlyExpenses(petId, year);
      successResponse(res, expenses);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/by-category/:category - Get expenses by category
  getExpensesByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;
      const petId = req.query.petId as string;

      if (!category) {
        throw createError('Category is required', 400, 'MISSING_CATEGORY');
      }

      const expenses = await this.expenseService.getExpensesByCategory(category, petId);
      successResponse(res, expenses);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/export/csv - Export expenses as CSV
  exportExpensesCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const csvContent = await this.expenseService.exportExpensesCSV(petId, startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/expenses/export/pdf - Export expenses as PDF
  exportExpensesPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This will be implemented after pdfkit is installed
      throw createError('PDF export not yet implemented', 501, 'NOT_IMPLEMENTED');
    } catch (error) {
      next(error);
    }
  };
}
