import { Schema, model } from 'mongoose';

const deviceTrialRegistrySchema = new Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  firstTrialUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  trialUsedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const DeviceTrialRegistryModel = model('DeviceTrialRegistry', deviceTrialRegistrySchema);