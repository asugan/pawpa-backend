import { Schema, model } from 'mongoose';

const expenseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'TRY' },
  paymentMethod: String,
  description: String,
  date: { type: Date, required: true },
  receiptPhoto: String,
  vendor: String,
  notes: String,
}, {
  timestamps: true
});

// Compound indexes
expenseSchema.index({ userId: 1, petId: 1 });
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

export const ExpenseModel = model('Expense', expenseSchema);