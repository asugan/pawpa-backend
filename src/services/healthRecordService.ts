import { FilterQuery, HydratedDocument } from 'mongoose';
import { HealthRecordModel, IHealthRecordDocument } from '../models/mongoose';
import { PetModel } from '../models/mongoose';
import { HealthRecordQueryParams, CreateHealthRecordRequest, UpdateHealthRecordRequest } from '../types/api';
import { parseUTCDate } from '../lib/dateUtils';

export class HealthRecordService {
  /**
   * Get health records for a user, optionally filtered by petId
   */
  async getHealthRecordsByPetId(
    userId: string,
    petId?: string,
    params?: HealthRecordQueryParams
  ): Promise<{ records: HydratedDocument<IHealthRecordDocument>[]; total: number }> {
    const { page = 1, limit = 10, type, startDate, endDate } = params ?? {};
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const whereClause: FilterQuery<IHealthRecordDocument> = { userId };

    if (petId) {
      whereClause.petId = petId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.$gte = parseUTCDate(startDate);
      }
      if (endDate) {
        whereClause.date.$lte = parseUTCDate(endDate);
      }
    }

    // Get total count
    const total = await HealthRecordModel.countDocuments(whereClause);

    // Get records with pagination
    const records = await HealthRecordModel.find(whereClause)
      .sort({ date: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return {
      records,
      total,
    };
  }

  /**
   * Get health record by ID, ensuring it belongs to the user
   */
  async getHealthRecordById(
    userId: string,
    id: string
  ): Promise<HydratedDocument<IHealthRecordDocument> | null> {
    const record = await HealthRecordModel.findOne({ _id: id, userId }).exec();
    return record ?? null;
  }

  /**
   * Create health record, ensuring the pet belongs to the user
   */
  async createHealthRecord(
    userId: string,
    recordData: CreateHealthRecordRequest
  ): Promise<HydratedDocument<IHealthRecordDocument>> {
    // Verify pet exists and belongs to user
    const pet = await PetModel.findOne({ _id: recordData.petId, userId }).exec();

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newRecord = new HealthRecordModel({ ...recordData, userId });
    const createdRecord = await newRecord.save();

    if (!createdRecord) {
      throw new Error('Failed to create health record');
    }
    return createdRecord;
  }

  /**
   * Update health record, ensuring it belongs to the user
   */
  async updateHealthRecord(
    userId: string,
    id: string,
    updates: UpdateHealthRecordRequest
  ): Promise<HydratedDocument<IHealthRecordDocument> | null> {
    // Don't allow updating userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _userId, ...safeUpdates } = updates;

    const updatedRecord = await HealthRecordModel.findOneAndUpdate(
      { _id: id, userId },
      safeUpdates,
      { new: true }
    ).exec();

    return updatedRecord ?? null;
  }

  /**
   * Delete health record, ensuring it belongs to the user
   */
  async deleteHealthRecord(userId: string, id: string): Promise<boolean> {
    const deletedRecord = await HealthRecordModel.findOneAndDelete({ _id: id, userId }).exec();
    return !!deletedRecord;
  }

  /**
   * Get upcoming vaccinations for a user
   */
  async getUpcomingVaccinations(
    userId: string,
    petId?: string
  ): Promise<HydratedDocument<IHealthRecordDocument>[]> {
    const now = new Date();
    const whereClause: FilterQuery<IHealthRecordDocument> = {
      userId,
      type: 'vaccination',
      nextDueDate: { $gte: now }
    };

    if (petId) {
      whereClause.petId = petId;
    }

    return await HealthRecordModel.find(whereClause)
      .sort({ nextDueDate: 1 })
      .exec();
  }
}
