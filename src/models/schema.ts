import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Pets table
export const pets = sqliteTable('pets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  breed: text('breed'),
  birthDate: integer('birth_date', { mode: 'timestamp' }),
  weight: real('weight'),
  gender: text('gender'),
  profilePhoto: text('profile_photo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Health records table
export const healthRecords = sqliteTable('health_records', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  veterinarian: text('veterinarian'),
  clinic: text('clinic'),
  cost: real('cost'),
  nextDueDate: integer('next_due_date', { mode: 'timestamp' }),
  attachments: text('attachments'),
  vaccineName: text('vaccine_name'),
  vaccineManufacturer: text('vaccine_manufacturer'),
  batchNumber: text('batch_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Events table
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  location: text('location'),
  notes: text('notes'),
  reminder: integer('reminder', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Feeding schedules table
export const feedingSchedules = sqliteTable('feeding_schedules', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  time: text('time').notNull(),
  foodType: text('food_type').notNull(),
  amount: text('amount').notNull(),
  days: text('days').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Expenses table
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'food', 'veterinary', 'medication', etc.
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('TRY'), // TRY, USD, EUR, etc.
  paymentMethod: text('payment_method'), // 'cash', 'credit_card', 'debit_card', 'bank_transfer'
  description: text('description'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  receiptPhoto: text('receipt_photo'), // URL/path to receipt image
  vendor: text('vendor'), // Store/clinic name
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Budget limits table
export const budgetLimits = sqliteTable('budget_limits', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  category: text('category'), // null = overall budget
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('TRY'),
  period: text('period').notNull(), // 'monthly', 'yearly'
  alertThreshold: real('alert_threshold').notNull().default(0.8), // Alert at 80%
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const petsRelations = relations(pets, ({ many }) => ({
  healthRecords: many(healthRecords),
  events: many(events),
  feedingSchedules: many(feedingSchedules),
  expenses: many(expenses),
  budgetLimits: many(budgetLimits),
}));

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  pet: one(pets, {
    fields: [healthRecords.petId],
    references: [pets.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  pet: one(pets, {
    fields: [events.petId],
    references: [pets.id],
  }),
}));

export const feedingSchedulesRelations = relations(feedingSchedules, ({ one }) => ({
  pet: one(pets, {
    fields: [feedingSchedules.petId],
    references: [pets.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  pet: one(pets, {
    fields: [expenses.petId],
    references: [pets.id],
  }),
}));

export const budgetLimitsRelations = relations(budgetLimits, ({ one }) => ({
  pet: one(pets, {
    fields: [budgetLimits.petId],
    references: [pets.id],
  }),
}));

// Types
export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
export type HealthRecord = typeof healthRecords.$inferSelect;
export type NewHealthRecord = typeof healthRecords.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type FeedingSchedule = typeof feedingSchedules.$inferSelect;
export type NewFeedingSchedule = typeof feedingSchedules.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type BudgetLimit = typeof budgetLimits.$inferSelect;
export type NewBudgetLimit = typeof budgetLimits.$inferInsert;