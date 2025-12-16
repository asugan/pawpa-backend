import { Query, Schema, model } from 'mongoose';
import { IPetDocument } from './types';

const petSchema = new Schema<IPetDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  breed: String,
  birthDate: Date,
  weight: Number,
  gender: String,
  profilePhoto: String,
}, {
  timestamps: true
});

// Compound indexes for performance
petSchema.index({ userId: 1, name: 1 });

// Cascade delete middleware
petSchema.pre('findOneAndDelete', async function(this: Query<IPetDocument, IPetDocument>) {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const query = this.getQuery();
  const petId = query._id;

  if (!petId) return;

  // Get referenced models (dynamic import to avoid circular dependencies)
  const { ExpenseModel } = await import('./expense');
  const { HealthRecordModel } = await import('./healthRecord');
  const { EventModel } = await import('./event');
  const { FeedingScheduleModel } = await import('./feedingSchedule');
  const { BudgetLimitModel } = await import('./budgetLimit');

  // Delete related documents
  await ExpenseModel.deleteMany({ petId });
  await HealthRecordModel.deleteMany({ petId });
  await EventModel.deleteMany({ petId });
  await FeedingScheduleModel.deleteMany({ petId });
  await BudgetLimitModel.deleteMany({ petId });
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
});

export const PetModel = model<IPetDocument>('Pet', petSchema);