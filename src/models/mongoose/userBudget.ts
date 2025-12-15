import { Schema, model } from 'mongoose';

const userBudgetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'TRY' },
  alertThreshold: { type: Number, default: 0.8 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const UserBudgetModel = model('UserBudget', userBudgetSchema);