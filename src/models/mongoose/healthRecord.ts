import { Schema, model } from 'mongoose';
import { IHealthRecordDocument } from './types';

const healthRecordSchema = new Schema<IHealthRecordDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  veterinarian: String,
  clinic: String,
  cost: Number,
  nextDueDate: Date,
  attachments: String,
  vaccineName: String,
  vaccineManufacturer: String,
  batchNumber: String,
}, {
  timestamps: true
});

// Compound indexes
healthRecordSchema.index({ userId: 1, petId: 1 });
healthRecordSchema.index({ userId: 1, date: -1 });

export const HealthRecordModel = model<IHealthRecordDocument>('HealthRecord', healthRecordSchema);