import { eq, and, gte, lte, between, desc, count, sum, sql } from 'drizzle-orm';
import { db, expenses, pets } from '../config/database';
import { ExpenseQueryParams } from '../types/api';
import { Expense, NewExpense } from '../models/schema';
import { generateId } from '../utils/id';

export class ExpenseService {
  async getExpensesByPetId(petId: string, params: ExpenseQueryParams): Promise<{ expenses: Expense[]; total: number }> {
    const { page = 1, limit = 10, category, startDate, endDate, minAmount, maxAmount, currency, paymentMethod } = params;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(expenses.petId, petId)];

    if (category) {
      conditions.push(eq(expenses.category, category));
    }

    if (currency) {
      conditions.push(eq(expenses.currency, currency));
    }

    if (paymentMethod) {
      conditions.push(eq(expenses.paymentMethod, paymentMethod));
    }

    if (startDate) {
      conditions.push(gte(expenses.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(expenses.date, new Date(endDate)));
    }

    if (minAmount !== undefined) {
      conditions.push(gte(expenses.amount, minAmount));
    }

    if (maxAmount !== undefined) {
      conditions.push(lte(expenses.amount, maxAmount));
    }

    const whereClause = and(...conditions);

    // Get total count
    const result = await db
      .select({ total: count() })
      .from(expenses)
      .where(whereClause);

    const total = result[0]?.total || 0;

    // Get expenses with pagination
    const expenseList = await db
      .select()
      .from(expenses)
      .where(whereClause)
      .orderBy(desc(expenses.date))
      .limit(limit)
      .offset(offset);

    return {
      expenses: expenseList,
      total,
    };
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));

    return expense || null;
  }

  async createExpense(expenseData: Omit<NewExpense, 'id' | 'createdAt'>): Promise<Expense> {
    // Verify pet exists
    const [pet] = await db.select().from(pets).where(eq(pets.id, expenseData.petId));
    if (!pet) {
      throw new Error('Pet not found');
    }

    const newExpense: NewExpense = {
      id: generateId(),
      ...expenseData,
      createdAt: new Date(),
    };

    const result = await db
      .insert(expenses)
      .values(newExpense)
      .returning();

    const createdExpense = result[0];
    if (!createdExpense) {
      throw new Error('Failed to create expense');
    }
    return createdExpense;
  }

  async updateExpense(id: string, updates: Partial<NewExpense>): Promise<Expense | null> {
    const [updatedExpense] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning();

    return updatedExpense || null;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const [deletedExpense] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();

    return !!deletedExpense;
  }

  async getExpensesByDateRange(petId: string | undefined, startDate: Date, endDate: Date): Promise<Expense[]> {
    const conditions = [
      between(expenses.date, startDate, endDate)
    ];

    if (petId) {
      conditions.push(eq(expenses.petId, petId));
    }

    return await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date));
  }

  async getExpenseStats(petId?: string, startDate?: Date, endDate?: Date, category?: string): Promise<{
    total: number;
    count: number;
    average: number;
    byCategory: { category: string; total: number; count: number }[];
    byCurrency: { currency: string; total: number }[];
  }> {
    const conditions = [];

    if (petId) {
      conditions.push(eq(expenses.petId, petId));
    }

    if (startDate) {
      conditions.push(gte(expenses.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(expenses.date, endDate));
    }

    if (category) {
      conditions.push(eq(expenses.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total and count
    const totalResult = await db
      .select({
        total: sum(expenses.amount),
        count: count(),
      })
      .from(expenses)
      .where(whereClause);

    const total = Number(totalResult[0]?.total || 0);
    const expenseCount = totalResult[0]?.count || 0;
    const average = expenseCount > 0 ? total / expenseCount : 0;

    // Get stats by category
    const byCategory = await db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
        count: count(),
      })
      .from(expenses)
      .where(whereClause)
      .groupBy(expenses.category);

    // Get stats by currency
    const byCurrency = await db
      .select({
        currency: expenses.currency,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(whereClause)
      .groupBy(expenses.currency);

    return {
      total,
      count: expenseCount,
      average,
      byCategory: byCategory.map(item => ({
        category: item.category,
        total: Number(item.total || 0),
        count: item.count,
      })),
      byCurrency: byCurrency.map(item => ({
        currency: item.currency,
        total: Number(item.total || 0),
      })),
    };
  }

  async getMonthlyExpenses(petId?: string, year?: number, month?: number): Promise<Expense[]> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    return this.getExpensesByDateRange(petId, startDate, endDate);
  }

  async getYearlyExpenses(petId?: string, year?: number): Promise<Expense[]> {
    const now = new Date();
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    return this.getExpensesByDateRange(petId, startDate, endDate);
  }

  async getExpensesByCategory(category: string, petId?: string): Promise<Expense[]> {
    const conditions = [eq(expenses.category, category)];

    if (petId) {
      conditions.push(eq(expenses.petId, petId));
    }

    return await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date));
  }

  async exportExpensesCSV(petId?: string, startDate?: Date, endDate?: Date): Promise<string> {
    const conditions = [];

    if (petId) {
      conditions.push(eq(expenses.petId, petId));
    }

    if (startDate) {
      conditions.push(gte(expenses.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(expenses.date, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const expenseList = await db
      .select()
      .from(expenses)
      .where(whereClause)
      .orderBy(desc(expenses.date));

    // Generate CSV
    const headers = ['ID', 'Pet ID', 'Category', 'Amount', 'Currency', 'Payment Method', 'Description', 'Date', 'Vendor', 'Notes'];
    const rows = expenseList.map(expense => [
      expense.id,
      expense.petId,
      expense.category,
      expense.amount.toString(),
      expense.currency,
      expense.paymentMethod || '',
      expense.description || '',
      expense.date.toISOString(),
      expense.vendor || '',
      expense.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
