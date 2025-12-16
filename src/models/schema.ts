import { Document } from 'mongoose';
import {
  IBudgetLimitDocument,
  IEventDocument,
  IExpenseDocument,
  IFeedingScheduleDocument,
  IHealthRecordDocument,
  IPetDocument,
  IUserBudgetDocument
} from './mongoose/types';

export type Pet = IPetDocument;
export type NewPet = Omit<IPetDocument, '_id' | 'createdAt' | 'updatedAt' | keyof Document>;

export type HealthRecord = IHealthRecordDocument;
export type NewHealthRecord = Omit<IHealthRecordDocument, '_id' | 'createdAt' | 'updatedAt' | keyof Document>;

export type Event = IEventDocument;
export type NewEvent = Omit<IEventDocument, '_id' | 'createdAt' | 'updatedAt' | keyof Document>;

export type FeedingSchedule = IFeedingScheduleDocument;
export type NewFeedingSchedule = Omit<IFeedingScheduleDocument, '_id' | 'createdAt' | 'updatedAt' | keyof Document>;

export type Expense = IExpenseDocument;
export type NewExpense = Omit<IExpenseDocument, '_id' | 'createdAt' | 'updatedAt' | keyof Document>;

export type BudgetLimit = IBudgetLimitDocument;
export type NewBudgetLimit = Omit<IBudgetLimitDocument, '_id' | 'createdAt' | 'updatedAt' | keyof Document>;

export type UserBudget = IUserBudgetDocument;
export type NewUserBudget = Omit<IUserBudgetDocument, '_id' | 'createdAt' | 'updatedAt' | keyof Document>;
