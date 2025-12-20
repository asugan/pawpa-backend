// Centralized exports for all mongoose models
export { PetModel } from './pet';
export { HealthRecordModel } from './healthRecord';
export { EventModel } from './event';
export { FeedingScheduleModel } from './feedingSchedule';
export { ExpenseModel } from './expense';
export { BudgetLimitModel } from './budgetLimit';
export { UserBudgetModel } from './userBudget';
export { SubscriptionModel } from './subscription';
export { DeviceTrialRegistryModel } from './deviceTrialRegistry';
export { UserTrialRegistryModel } from './userTrialRegistry';

// Export document interfaces
export type {
  IPetDocument,
  IHealthRecordDocument,
  IEventDocument,
  IFeedingScheduleDocument,
  IExpenseDocument,
  IUserBudgetDocument,
  ISubscriptionDocument,
  IBudgetLimitDocument,
  IDeviceTrialRegistryDocument,
  IUserTrialRegistryDocument
} from './types';
