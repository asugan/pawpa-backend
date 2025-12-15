import { FeedingScheduleModel } from '../models/mongoose/feedingSchedule';
import { PetModel } from '../models/mongoose/pet';
import { FeedingScheduleQueryParams } from '../types/api';
import { toUTCISOString } from '../lib/dateUtils';

export class FeedingScheduleService {
  /**
   * Get feeding schedules for a user, optionally filtered by petId
   */
  async getFeedingSchedulesByPetId(
    userId: string,
    petId?: string,
    params?: FeedingScheduleQueryParams
  ): Promise<{ schedules: any[]; total: number }> {
    const { page = 1, limit = 10, isActive, foodType } = params ?? {};
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const whereClause: any = { userId };

    // Only filter by petId if provided
    if (petId) {
      whereClause.petId = petId;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (foodType) {
      whereClause.foodType = foodType;
    }

    // Get total count
    const total = await FeedingScheduleModel.countDocuments(whereClause);

    // Get schedules with pagination
    const schedules = await FeedingScheduleModel.find(whereClause)
      .sort({ time: 1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return {
      schedules,
      total,
    };
  }

  /**
   * Get feeding schedule by ID, ensuring it belongs to the user
   */
  async getFeedingScheduleById(
    userId: string,
    id: string
  ): Promise<any | null> {
    const schedule = await FeedingScheduleModel.findOne({ _id: id, userId }).exec();
    return schedule ?? null;
  }

  /**
   * Create feeding schedule, ensuring the pet belongs to the user
   */
  async createFeedingSchedule(
    userId: string,
    scheduleData: any
  ): Promise<any> {
    // Verify pet exists and belongs to user
    const pet = await PetModel.findOne({ _id: scheduleData.petId, userId }).exec();

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newSchedule = new FeedingScheduleModel({ ...scheduleData, userId });
    const createdSchedule = await newSchedule.save();

    if (!createdSchedule) {
      throw new Error('Failed to create feeding schedule');
    }
    return createdSchedule;
  }

  /**
   * Update feeding schedule, ensuring it belongs to the user
   */
  async updateFeedingSchedule(
    userId: string,
    id: string,
    updates: Partial<any>
  ): Promise<any | null> {
    // Don't allow updating userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _userId, ...safeUpdates } = updates;

    const updatedSchedule = await FeedingScheduleModel.findOneAndUpdate(
      { _id: id, userId },
      safeUpdates,
      { new: true }
    ).exec();

    return updatedSchedule ?? null;
  }

  /**
   * Delete feeding schedule, ensuring it belongs to the user
   */
  async deleteFeedingSchedule(userId: string, id: string): Promise<boolean> {
    const deletedSchedule = await FeedingScheduleModel.findOneAndDelete({ _id: id, userId }).exec();
    return !!deletedSchedule;
  }

  /**
   * Get active schedules for a user
   */
  async getActiveSchedules(
    userId: string,
    petId?: string
  ): Promise<any[]> {
    const whereClause: any = {
      userId,
      isActive: true
    };

    if (petId) {
      whereClause.petId = petId;
    }

    return await FeedingScheduleModel.find(whereClause)
      .sort({ time: 1 })
      .exec();
  }

  /**
   * Get today's schedules for a user
   */
  async getTodaySchedules(
    userId: string,
    petId?: string
  ): Promise<any[]> {
    // Use UTC date to get consistent day regardless of server timezone
    const today = new Date(toUTCISOString(new Date())).getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const todayName = dayNames[today];

    const whereClause: any = {
      userId,
      isActive: true,
      days: { $regex: todayName, $options: 'i' }
    };

    if (petId) {
      whereClause.petId = petId;
    }

    return await FeedingScheduleModel.find(whereClause)
      .sort({ time: 1 })
      .exec();
  }

  /**
   * Get next feeding time for a user
   */
  async getNextFeedingTime(
    userId: string,
    petId?: string
  ): Promise<any | null> {
    // Use UTC date to get consistent day regardless of server timezone
    const today = new Date(toUTCISOString(new Date())).getUTCDay();
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const todayName = dayNames[today];

    const whereClause: any = {
      userId,
      isActive: true,
      days: { $regex: todayName, $options: 'i' }
    };

    if (petId) {
      whereClause.petId = petId;
    }

    const schedule = await FeedingScheduleModel.findOne(whereClause)
      .sort({ time: 1 })
      .exec();

    return schedule ?? null;
  }
}
