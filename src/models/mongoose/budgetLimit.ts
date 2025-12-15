import { Schema, model } from 'mongoose';

const budgetLimitSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
  category: String, // null = overall budget
  amount: { type: Number, required: true },
  currency: { type: String, default: 'TRY' },
  period: { type: String, required: true }, // 'monthly', 'yearly'
  alertThreshold: { type: Number, default: 0.8 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Compound indexes
budgetLimitSchema.index({ userId: 1, petId: 1 });
budgetLimitSchema.index({ userId: 1, category: 1 });

export const BudgetLimitModel = model('BudgetLimit', budgetLimitSchema);