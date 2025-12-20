import { Schema, model } from 'mongoose';
import { IUserTrialRegistryDocument } from './types';

const userTrialRegistrySchema = new Schema<IUserTrialRegistryDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  trialUsedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const UserTrialRegistryModel = model<IUserTrialRegistryDocument>('UserTrialRegistry', userTrialRegistrySchema);
