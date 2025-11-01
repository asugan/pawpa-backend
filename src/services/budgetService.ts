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
  async getBudgetLimitsByPetId(petId: string, params: BudgetQueryParams): Promise<{ budgetLimits: BudgetLimit[]; total: number }> {
    const { page = 1, limit = 10, period, isActive, category } = params;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(budgetLimits.petId, petId)];

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

  async getBudgetLimitById(id: string): Promise<BudgetLimit | null> {
    const [budgetLimit] = await db
      .select()
      .from(budgetLimits)
      .where(eq(budgetLimits.id, id));

    return budgetLimit || null;
  }

  async createBudgetLimit(budgetData: Omit<NewBudgetLimit, 'id' | 'createdAt'>): Promise<BudgetLimit> {
    // Verify pet exists
    const [pet] = await db.select().from(pets).where(eq(pets.id, budgetData.petId));
    if (!pet) {
      throw new Error('Pet not found');
    }

    const newBudgetLimit: NewBudgetLimit = {
      id: generateId(),
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

  async updateBudgetLimit(id: string, updates: Partial<NewBudgetLimit>): Promise<BudgetLimit | null> {
    const [updatedBudgetLimit] = await db
      .update(budgetLimits)
      .set(updates)
      .where(eq(budgetLimits.id, id))
      .returning();

    return updatedBudgetLimit || null;
  }

  async deleteBudgetLimit(id: string): Promise<boolean> {
    const [deletedBudgetLimit] = await db
      .delete(budgetLimits)
      .where(eq(budgetLimits.id, id))
      .returning();

    return !!deletedBudgetLimit;
  }

  async getActiveBudgetLimits(petId?: string): Promise<BudgetLimit[]> {
    const conditions = [eq(budgetLimits.isActive, true)];

    if (petId) {
      conditions.push(eq(budgetLimits.petId, petId));
    }

    return await db
      .select()
      .from(budgetLimits)
      .where(and(...conditions))
      .orderBy(desc(budgetLimits.createdAt));
  }

  async checkBudgetAlerts(petId?: string): Promise<BudgetAlert[]> {
    const activeBudgets = await this.getActiveBudgetLimits(petId);
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

  async getBudgetStatus(budgetLimitId: string): Promise<{
    budgetLimit: BudgetLimit;
    currentSpending: number;
    percentage: number;
    remainingAmount: number;
  } | null> {
    const budget = await this.getBudgetLimitById(budgetLimitId);
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

  async getAllBudgetStatuses(petId?: string): Promise<Array<{
    budgetLimit: BudgetLimit;
    currentSpending: number;
    percentage: number;
    remainingAmount: number;
  }>> {
    const activeBudgets = await this.getActiveBudgetLimits(petId);
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
