import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ==========================================
// Better-Auth Tables
// ==========================================

// User table (better-auth)
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Session table (better-auth)
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Account table (better-auth - for OAuth providers)
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Verification table (better-auth - for email verification, password reset)
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// Application Tables (with userId)
// ==========================================

// Pets table
export const pets = sqliteTable('pets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  petId: text('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  category: text('category'), // null = overall budget
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('TRY'),
  period: text('period').notNull(), // 'monthly', 'yearly'
  alertThreshold: real('alert_threshold').notNull().default(0.8), // Alert at 80%
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Subscriptions table - unified table for internal trials and RevenueCat subscriptions
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().default('internal'), // 'internal' | 'revenuecat'
  revenueCatId: text('revenue_cat_id'), // nullable, only for revenuecat subscriptions
  tier: text('tier').notNull().default('pro'), // 'pro' (extensible for future tiers)
  status: text('status').notNull().default('active'), // 'active' | 'expired' | 'cancelled'
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Device trial registry - tracks devices that have used trials (fraud prevention)
export const deviceTrialRegistry = sqliteTable('device_trial_registry', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().unique(),
  firstTrialUserId: text('first_trial_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  trialUsedAt: integer('trial_used_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ==========================================
// Relations
// ==========================================

// User relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  pets: many(pets),
  healthRecords: many(healthRecords),
  events: many(events),
  feedingSchedules: many(feedingSchedules),
  expenses: many(expenses),
  budgetLimits: many(budgetLimits),
  subscriptions: many(subscriptions),
}));

// Session relations
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

// Account relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Pet relations
export const petsRelations = relations(pets, ({ one, many }) => ({
  user: one(user, {
    fields: [pets.userId],
    references: [user.id],
  }),
  healthRecords: many(healthRecords),
  events: many(events),
  feedingSchedules: many(feedingSchedules),
  expenses: many(expenses),
  budgetLimits: many(budgetLimits),
}));

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  user: one(user, {
    fields: [healthRecords.userId],
    references: [user.id],
  }),
  pet: one(pets, {
    fields: [healthRecords.petId],
    references: [pets.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(user, {
    fields: [events.userId],
    references: [user.id],
  }),
  pet: one(pets, {
    fields: [events.petId],
    references: [pets.id],
  }),
}));

export const feedingSchedulesRelations = relations(feedingSchedules, ({ one }) => ({
  user: one(user, {
    fields: [feedingSchedules.userId],
    references: [user.id],
  }),
  pet: one(pets, {
    fields: [feedingSchedules.petId],
    references: [pets.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(user, {
    fields: [expenses.userId],
    references: [user.id],
  }),
  pet: one(pets, {
    fields: [expenses.petId],
    references: [pets.id],
  }),
}));

export const budgetLimitsRelations = relations(budgetLimits, ({ one }) => ({
  user: one(user, {
    fields: [budgetLimits.userId],
    references: [user.id],
  }),
  pet: one(pets, {
    fields: [budgetLimits.petId],
    references: [pets.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
}));

export const deviceTrialRegistryRelations = relations(deviceTrialRegistry, ({ one }) => ({
  firstUser: one(user, {
    fields: [deviceTrialRegistry.firstTrialUserId],
    references: [user.id],
  }),
}));

// ==========================================
// Types
// ==========================================

// Auth types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

// Application types
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
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type DeviceTrialRegistry = typeof deviceTrialRegistry.$inferSelect;
export type NewDeviceTrialRegistry = typeof deviceTrialRegistry.$inferInsert;
