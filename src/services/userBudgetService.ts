import { UserBudgetModel } from '../models/mongoose/userBudget';
import { ExpenseModel } from '../models/mongoose/expense';
import { PetModel } from '../models/mongoose/pet';

// Input types for UserBudget operations
export interface SetUserBudgetInput {
  amount: number;
  currency: string;
  alertThreshold?: number; // optional, default 0.8
  isActive?: boolean; // optional, default true
}

// Budget status interface with pet breakdown
export interface BudgetStatus {
  budget: any;
  currentSpending: number;
  percentage: number;
  remainingAmount: number;
  isAlert: boolean;
  petBreakdown?: {
    petId: string;
    petName: string;
    spending: number;
  }[];
}

// Budget alert interface
export interface BudgetAlert {
  budget: any;
  currentSpending: number;
  percentage: number;
  isExceeded: boolean;
  remainingAmount: number;
  petBreakdown?: {
    petId: string;
    petName: string;
    spending: number;
  }[];
}

export class UserBudgetService {
  /**
   * Get budget by userId (sadece bir record dönecek)
   */
  async getBudgetByUserId(userId: string): Promise<any | null> {
    const budget = await UserBudgetModel.findOne({ userId }).exec();
    return budget ?? null;
  }

  /**
   * Create/update budget (upsert pattern)
   */
  async setUserBudget(
    userId: string,
    data: SetUserBudgetInput
  ): Promise<any> {
    // Validate input
    if (!data.amount || data.amount <= 0) {
      throw new Error('Budget amount must be greater than 0');
    }

    if (!data.currency || data.currency.trim() === '') {
      throw new Error('Currency is required');
    }

    // Check if budget already exists for this user
    const existingBudget = await this.getBudgetByUserId(userId);

    if (existingBudget) {
      // Update existing budget
      const updatedBudgetData = {
        amount: data.amount,
        currency: data.currency,
        alertThreshold: data.alertThreshold ?? 0.8,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      };

      const updatedBudget = await UserBudgetModel.findOneAndUpdate(
        { userId },
        updatedBudgetData,
        { new: true }
      ).exec();

      if (!updatedBudget) {
        throw new Error('Failed to update budget');
      }

      return updatedBudget;
    } else {
      // Create new budget
      const newBudget = new UserBudgetModel({
        userId,
        amount: data.amount,
        currency: data.currency,
        alertThreshold: data.alertThreshold ?? 0.8,
        isActive: data.isActive ?? true,
      });

      const createdBudget = await newBudget.save();

      if (!createdBudget) {
        throw new Error('Failed to create budget');
      }

      return createdBudget;
    }
  }

  /**
   * Delete user budget
   */
  async deleteUserBudget(userId: string): Promise<boolean> {
    const deletedBudget = await UserBudgetModel.findOneAndDelete({ userId }).exec();
    return !!deletedBudget;
  }

  /**
   * Simple budget status calculation (tüm petlerin harcamalarını içerir)
   */
  async getBudgetStatus(userId: string): Promise<BudgetStatus | null> {
    const budget = await this.getBudgetByUserId(userId);
    if (!budget?.isActive) {
      return null;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Get all expenses for the user in current month with matching currency
    const monthlyExpenses = await ExpenseModel.aggregate([
      {
        $match: {
          userId: userId,
          currency: budget.currency,
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'petId',
          foreignField: '_id',
          as: 'pet'
        }
      },
      { $unwind: '$pet' },
      {
        $project: {
          petId: '$petId',
          amount: 1,
          description: 1,
          date: 1,
          petName: '$pet.name'
        }
      }
    ]);

    // Calculate total spending
    const currentSpending = monthlyExpenses.reduce(
      (sum: number, expense: any) => sum + expense.amount,
      0
    );

    const percentage =
      budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
    const remainingAmount = budget.amount - currentSpending;
    const isAlert = percentage >= budget.alertThreshold! * 100;

    // Calculate pet breakdown
    const petBreakdown = monthlyExpenses.reduce(
      (acc: any[], expense: any) => {
        const existing = acc.find(item => item.petId === expense.petId);
        if (existing) {
          existing.spending += expense.amount;
        } else {
          acc.push({
            petId: expense.petId,
            petName: expense.petName || 'Unknown Pet',
            spending: expense.amount,
          });
        }
        return acc;
      },
      [] as { petId: string; petName: string; spending: number }[]
    );

    return {
      budget,
      currentSpending,
      percentage,
      remainingAmount,
      isAlert,
      petBreakdown,
    };
  }

  /**
   * Simple alert check (tüm petler için)
   */
  async checkBudgetAlert(userId: string): Promise<BudgetAlert | null> {
    const budgetStatus = await this.getBudgetStatus(userId);

    if (!budgetStatus?.isAlert) {
      return null;
    }

    return {
      budget: budgetStatus.budget,
      currentSpending: budgetStatus.currentSpending,
      percentage: budgetStatus.percentage,
      isExceeded: budgetStatus.percentage >= 100,
      remainingAmount: budgetStatus.remainingAmount,
      petBreakdown: budgetStatus.petBreakdown,
    };
  }

  /**
   * Get all active user budgets (for admin purposes)
   */
  async getActiveUserBudgets(): Promise<any[]> {
    return await UserBudgetModel.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .exec();
  }

  /**
   * Get budget status for multiple users (batch operation)
   */
  async getBatchBudgetStatus(userIds: string[]): Promise<BudgetStatus[]> {
    const statuses: BudgetStatus[] = [];

    for (const userId of userIds) {
      const status = await this.getBudgetStatus(userId);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Check budget alerts for multiple users (batch operation)
   */
  async getBatchBudgetAlerts(userIds: string[]): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = [];

    for (const userId of userIds) {
      const alert = await this.checkBudgetAlert(userId);
      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }
}
