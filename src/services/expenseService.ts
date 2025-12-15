import { FilterQuery, HydratedDocument } from 'mongoose';
import { ExpenseModel, IExpenseDocument } from '../models/mongoose';
import { PetModel } from '../models/mongoose';
import { ExpenseQueryParams, CreateExpenseRequest, UpdateExpenseRequest } from '../types/api';

export class ExpenseService {
  async getExpensesByPetId(
    userId: string,
    petId?: string,
    params?: ExpenseQueryParams
  ): Promise<{ expenses: HydratedDocument<IExpenseDocument>[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      currency,
      paymentMethod,
    } = params ?? {};
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const whereClause: FilterQuery<IExpenseDocument> = { userId };

    // Only filter by petId if provided
    if (petId) {
      whereClause.petId = petId;
    }

    if (category) {
      whereClause.category = category;
    }

    if (currency) {
      whereClause.currency = currency;
    }

    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.$gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.$lte = new Date(endDate);
      }
    }

    if (minAmount !== undefined) {
      whereClause.amount = { ...whereClause.amount, $gte: minAmount };
    }

    if (maxAmount !== undefined) {
      whereClause.amount = { ...whereClause.amount, $lte: maxAmount };
    }

    // Get total count
    const total = await ExpenseModel.countDocuments(whereClause);

    // Get expenses with pagination
    const expenseList = await ExpenseModel.find(whereClause)
      .sort({ date: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return {
      expenses: expenseList,
      total,
    };
  }

  async getExpenseById(userId: string, id: string): Promise<HydratedDocument<IExpenseDocument> | null> {
    const expense = await ExpenseModel.findOne({ _id: id, userId }).exec();
    return expense ?? null;
  }

  async createExpense(
    userId: string,
    expenseData: CreateExpenseRequest
  ): Promise<HydratedDocument<IExpenseDocument>> {
    // Verify pet exists and belongs to user
    const pet = await PetModel.findOne({ _id: expenseData.petId, userId }).exec();

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newExpense = new ExpenseModel({ ...expenseData, userId });
    const createdExpense = await newExpense.save();

    if (!createdExpense) {
      throw new Error('Failed to create expense');
    }
    return createdExpense;
  }

  async updateExpense(
    userId: string,
    id: string,
    updates: UpdateExpenseRequest
  ): Promise<HydratedDocument<IExpenseDocument> | null> {
    // Don't allow updating userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _userId, ...safeUpdates } = updates;

    const updatedExpense = await ExpenseModel.findOneAndUpdate(
      { _id: id, userId },
      safeUpdates,
      { new: true }
    ).exec();

    return updatedExpense ?? null;
  }

  async deleteExpense(userId: string, id: string): Promise<boolean> {
    const deletedExpense = await ExpenseModel.findOneAndDelete({ _id: id, userId }).exec();
    return !!deletedExpense;
  }

  async getExpensesByDateRange(
    userId: string,
    petId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<HydratedDocument<IExpenseDocument>[]> {
    const whereClause: FilterQuery<IExpenseDocument> = {
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (petId) {
      whereClause.petId = petId;
    }

    return await ExpenseModel.find(whereClause)
      .sort({ date: -1 })
      .exec();
  }

  async getExpenseStats(
    userId: string,
    petId?: string,
    startDate?: Date,
    endDate?: Date,
    category?: string
  ): Promise<{
    total: number;
    count: number;
    average: number;
    byCategory: { category: string; total: number; count: number }[];
    byCurrency: { currency: string; total: number }[];
  }> {
    const whereClause: FilterQuery<IExpenseDocument> = { userId };

    if (petId) {
      whereClause.petId = petId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.$gte = startDate;
      }
      if (endDate) {
        whereClause.date.$lte = endDate;
      }
    }

    if (category) {
      whereClause.category = category;
    }

    // Get total and count
    const [totalResult] = await ExpenseModel.aggregate([
      { $match: whereClause },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const total = totalResult?.total ?? 0;
    const expenseCount = totalResult?.count ?? 0;
    const average = expenseCount > 0 ? total / expenseCount : 0;

    // Get stats by category
    const byCategory = await ExpenseModel.aggregate([
      { $match: whereClause },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
    ]);

    // Get stats by currency
    const byCurrency = await ExpenseModel.aggregate([
      { $match: whereClause },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' },
        },
      },
      { $project: { _id: 0, currency: '$_id', total: 1 } },
    ]);

    return {
      total,
      count: expenseCount,
      average,
      byCategory,
      byCurrency,
    };
  }

  async getMonthlyExpenses(
    userId: string,
    petId?: string,
    year?: number,
    month?: number
  ): Promise<HydratedDocument<IExpenseDocument>[]> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    return this.getExpensesByDateRange(userId, petId, startDate, endDate);
  }

  async getYearlyExpenses(
    userId: string,
    petId?: string,
    year?: number
  ): Promise<HydratedDocument<IExpenseDocument>[]> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    return this.getExpensesByDateRange(userId, petId, startDate, endDate);
  }

  async getExpensesByCategory(
    userId: string,
    category: string,
    petId?: string
  ): Promise<HydratedDocument<IExpenseDocument>[]> {
    const whereClause: FilterQuery<IExpenseDocument> = {
      userId,
      category
    };

    if (petId) {
      whereClause.petId = petId;
    }

    return await ExpenseModel.find(whereClause)
      .sort({ date: -1 })
      .exec();
  }

  async exportExpensesCSV(
    userId: string,
    petId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const whereClause: FilterQuery<IExpenseDocument> = { userId };

    if (petId) {
      whereClause.petId = petId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.$gte = startDate;
      }
      if (endDate) {
        whereClause.date.$lte = endDate;
      }
    }

    const expenseList = await ExpenseModel.find(whereClause)
      .sort({ date: -1 })
      .exec();

    // Generate CSV
    const headers = [
      'ID',
      'Pet ID',
      'Category',
      'Amount',
      'Currency',
      'Payment Method',
      'Description',
      'Date',
      'Vendor',
      'Notes',
    ];
    const rows = expenseList.map((expense: HydratedDocument<IExpenseDocument>) => [
      expense.id,
      expense.petId,
      expense.category,
      expense.amount.toString(),
      expense.currency,
      expense.paymentMethod ?? '',
      expense.description ?? '',
      expense.date.toISOString(),
      expense.vendor ?? '',
      expense.notes ?? '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
