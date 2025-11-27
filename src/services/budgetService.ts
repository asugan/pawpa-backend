import { eq, and, gte, lte, sum, desc, count } from 'drizzle-orm';
import { db, budgetLimits, expenses, pets } from '../config/database';
import { BudgetQueryParams } from '../types/api';
import { BudgetLimit, NewBudgetLimit } from '../models/schema';
import { generateId } from '../utils/id';

export interface BudgetAlert {
  budgetLimit: BudgetLimit;
  currentSpending: number;
  percentage: number;
  isExceeded: boolean;
  remainingAmount: number;
}

export class BudgetService {
  /**
   * Get budget limits for a user, optionally filtered by petId
   */
  async getBudgetLimitsByPetId(userId: string, petId: string, params: BudgetQueryParams): Promise<{ budgetLimits: BudgetLimit[]; total: number }> {
    const { page = 1, limit = 10, period, isActive, category } = params;
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const conditions = [
      eq(budgetLimits.userId, userId),
      eq(budgetLimits.petId, petId)
    ];

    if (isActive !== undefined) {
      conditions.push(eq(budgetLimits.isActive, isActive));
    }

    if (period) {
      conditions.push(eq(budgetLimits.period, period));
    }

    if (category) {
      conditions.push(eq(budgetLimits.category, category));
    }

    const whereClause = and(...conditions);

    // Get total count
    const result = await db
      .select({ total: count() })
      .from(budgetLimits)
      .where(whereClause);

    const total = result[0]?.total || 0;

    // Get budget limits with pagination
    const limits = await db
      .select()
      .from(budgetLimits)
      .where(whereClause)
      .orderBy(desc(budgetLimits.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      budgetLimits: limits,
      total,
    };
  }

  /**
   * Get budget limit by ID, ensuring it belongs to the user
   */
  async getBudgetLimitById(userId: string, id: string): Promise<BudgetLimit | null> {
    const [budgetLimit] = await db
      .select()
      .from(budgetLimits)
      .where(and(eq(budgetLimits.id, id), eq(budgetLimits.userId, userId)));

    return budgetLimit || null;
  }

  /**
   * Create budget limit, ensuring the pet belongs to the user
   */
  async createBudgetLimit(userId: string, budgetData: Omit<NewBudgetLimit, 'id' | 'userId' | 'createdAt'>): Promise<BudgetLimit> {
    // Verify pet exists and belongs to user
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, budgetData.petId), eq(pets.userId, userId)));

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newBudgetLimit: NewBudgetLimit = {
      id: generateId(),
      userId,
      ...budgetData,
      createdAt: new Date(),
    };

    const result = await db
      .insert(budgetLimits)
      .values(newBudgetLimit)
      .returning();

    const createdBudgetLimit = result[0];
    if (!createdBudgetLimit) {
      throw new Error('Failed to create budget limit');
    }
    return createdBudgetLimit;
  }

  /**
   * Update budget limit, ensuring it belongs to the user
   */
  async updateBudgetLimit(userId: string, id: string, updates: Partial<NewBudgetLimit>): Promise<BudgetLimit | null> {
    // Don't allow updating userId
    const { userId: _, ...safeUpdates } = updates as any;

    const [updatedBudgetLimit] = await db
      .update(budgetLimits)
      .set(safeUpdates)
      .where(and(eq(budgetLimits.id, id), eq(budgetLimits.userId, userId)))
      .returning();

    return updatedBudgetLimit || null;
  }

  /**
   * Delete budget limit, ensuring it belongs to the user
   */
  async deleteBudgetLimit(userId: string, id: string): Promise<boolean> {
    const [deletedBudgetLimit] = await db
      .delete(budgetLimits)
      .where(and(eq(budgetLimits.id, id), eq(budgetLimits.userId, userId)))
      .returning();

    return !!deletedBudgetLimit;
  }

  /**
   * Get active budget limits for a user
   */
  async getActiveBudgetLimits(userId: string, petId?: string): Promise<BudgetLimit[]> {
    const conditions = [
      eq(budgetLimits.userId, userId),
      eq(budgetLimits.isActive, true)
    ];

    if (petId) {
      conditions.push(eq(budgetLimits.petId, petId));
    }

    return await db
      .select()
      .from(budgetLimits)
      .where(and(...conditions))
      .orderBy(desc(budgetLimits.createdAt));
  }

  /**
   * Check budget alerts for a user
   */
  async checkBudgetAlerts(userId: string, petId?: string): Promise<BudgetAlert[]> {
    const activeBudgets = await this.getActiveBudgetLimits(userId, petId);
    const alerts: BudgetAlert[] = [];

    const now = new Date();

    for (const budget of activeBudgets) {
      let startDate: Date;
      let endDate: Date;

      // Determine date range based on period
      if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else { // yearly
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      }

      // Build conditions for expense query
      const expenseConditions = [
        eq(expenses.petId, budget.petId),
        eq(expenses.currency, budget.currency),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate),
      ];

      // Add category filter if budget is category-specific
      if (budget.category) {
        expenseConditions.push(eq(expenses.category, budget.category));
      }

      // Calculate current spending
      const spendingResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...expenseConditions));

      const currentSpending = Number(spendingResult[0]?.total || 0);
      const percentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
      const isExceeded = percentage >= (budget.alertThreshold * 100);
      const remainingAmount = budget.amount - currentSpending;

      // Only include if threshold is exceeded
      if (isExceeded) {
        alerts.push({
          budgetLimit: budget,
          currentSpending,
          percentage,
          isExceeded,
          remainingAmount,
        });
      }
    }

    return alerts;
  }

  /**
   * Get budget status for a specific budget limit
   */
  async getBudgetStatus(userId: string, budgetLimitId: string): Promise<{
    budgetLimit: BudgetLimit;
    currentSpending: number;
    percentage: number;
    remainingAmount: number;
  } | null> {
    const budget = await this.getBudgetLimitById(userId, budgetLimitId);
    if (!budget) {
      return null;
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    // Determine date range based on period
    if (budget.period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else { // yearly
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // Build conditions for expense query
    const expenseConditions = [
      eq(expenses.petId, budget.petId),
      eq(expenses.currency, budget.currency),
      gte(expenses.date, startDate),
      lte(expenses.date, endDate),
    ];

    // Add category filter if budget is category-specific
    if (budget.category) {
      expenseConditions.push(eq(expenses.category, budget.category));
    }

    // Calculate current spending
    const spendingResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(...expenseConditions));

    const currentSpending = Number(spendingResult[0]?.total || 0);
    const percentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
    const remainingAmount = budget.amount - currentSpending;

    return {
      budgetLimit: budget,
      currentSpending,
      percentage,
      remainingAmount,
    };
  }

  /**
   * Get all budget statuses for a user
   */
  async getAllBudgetStatuses(userId: string, petId?: string): Promise<Array<{
    budgetLimit: BudgetLimit;
    currentSpending: number;
    percentage: number;
    remainingAmount: number;
  }>> {
    const activeBudgets = await this.getActiveBudgetLimits(userId, petId);
    const statuses = [];

    const now = new Date();

    for (const budget of activeBudgets) {
      let startDate: Date;
      let endDate: Date;

      // Determine date range based on period
      if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else { // yearly
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      }

      // Build conditions for expense query
      const expenseConditions = [
        eq(expenses.petId, budget.petId),
        eq(expenses.currency, budget.currency),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate),
      ];

      // Add category filter if budget is category-specific
      if (budget.category) {
        expenseConditions.push(eq(expenses.category, budget.category));
      }

      // Calculate current spending
      const spendingResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...expenseConditions));

      const currentSpending = Number(spendingResult[0]?.total || 0);
      const percentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
      const remainingAmount = budget.amount - currentSpending;

      statuses.push({
        budgetLimit: budget,
        currentSpending,
        percentage,
        remainingAmount,
      });
    }

    return statuses;
  }
}
