import { and, count, eq, like } from 'drizzle-orm';
import { db, feedingSchedules, pets } from '../config/database';
import { FeedingScheduleQueryParams } from '../types/api';
import { FeedingSchedule, NewFeedingSchedule } from '../models/schema';
import { generateId } from '../utils/id';
import { toUTCISOString } from '../lib/dateUtils';

export class FeedingScheduleService {
  /**
   * Get feeding schedules for a user, optionally filtered by petId
   */
  async getFeedingSchedulesByPetId(
    userId: string,
    petId?: string,
    params?: FeedingScheduleQueryParams
  ): Promise<{ schedules: FeedingSchedule[]; total: number }> {
    const { page = 1, limit = 10, isActive, foodType } = params ?? {};
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const conditions = [eq(feedingSchedules.userId, userId)];

    // Only filter by petId if provided
    if (petId) {
      conditions.push(eq(feedingSchedules.petId, petId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(feedingSchedules.isActive, isActive));
    }

    if (foodType) {
      conditions.push(eq(feedingSchedules.foodType, foodType));
    }

    const whereClause = and(...conditions);

    // Get total count
    const result = await db
      .select({ total: count() })
      .from(feedingSchedules)
      .where(whereClause);

    const total = result[0]?.total ?? 0;

    // Get schedules with pagination
    const schedules = await db
      .select()
      .from(feedingSchedules)
      .where(whereClause)
      .orderBy(feedingSchedules.time)
      .limit(limit)
      .offset(offset);

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
  ): Promise<FeedingSchedule | null> {
    const [schedule] = await db
      .select()
      .from(feedingSchedules)
      .where(
        and(eq(feedingSchedules.id, id), eq(feedingSchedules.userId, userId))
      );

    return schedule ?? null;
  }

  /**
   * Create feeding schedule, ensuring the pet belongs to the user
   */
  async createFeedingSchedule(
    userId: string,
    scheduleData: Omit<NewFeedingSchedule, 'id' | 'userId' | 'createdAt'>
  ): Promise<FeedingSchedule> {
    // Verify pet exists and belongs to user
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, scheduleData.petId), eq(pets.userId, userId)));

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newSchedule: NewFeedingSchedule = {
      id: generateId(),
      userId,
      ...scheduleData,
      createdAt: new Date(),
    };

    const result = await db
      .insert(feedingSchedules)
      .values(newSchedule)
      .returning();

    const createdSchedule = result[0];
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
    updates: Partial<NewFeedingSchedule>
  ): Promise<FeedingSchedule | null> {
    // Don't allow updating userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _userId, ...safeUpdates } = updates;

    const [updatedSchedule] = await db
      .update(feedingSchedules)
      .set(safeUpdates)
      .where(
        and(eq(feedingSchedules.id, id), eq(feedingSchedules.userId, userId))
      )
      .returning();

    return updatedSchedule ?? null;
  }

  /**
   * Delete feeding schedule, ensuring it belongs to the user
   */
  async deleteFeedingSchedule(userId: string, id: string): Promise<boolean> {
    const [deletedSchedule] = await db
      .delete(feedingSchedules)
      .where(
        and(eq(feedingSchedules.id, id), eq(feedingSchedules.userId, userId))
      )
      .returning();

    return !!deletedSchedule;
  }

  /**
   * Get active schedules for a user
   */
  async getActiveSchedules(
    userId: string,
    petId?: string
  ): Promise<FeedingSchedule[]> {
    const conditions = [
      eq(feedingSchedules.userId, userId),
      eq(feedingSchedules.isActive, true),
    ];

    if (petId) {
      conditions.push(eq(feedingSchedules.petId, petId));
    }

    return await db
      .select()
      .from(feedingSchedules)
      .where(and(...conditions))
      .orderBy(feedingSchedules.time);
  }

  /**
   * Get today's schedules for a user
   */
  async getTodaySchedules(
    userId: string,
    petId?: string
  ): Promise<FeedingSchedule[]> {
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

    const conditions = [
      eq(feedingSchedules.userId, userId),
      eq(feedingSchedules.isActive, true),
      like(feedingSchedules.days, `%${todayName}%`),
    ];

    if (petId) {
      conditions.push(eq(feedingSchedules.petId, petId));
    }

    return await db
      .select()
      .from(feedingSchedules)
      .where(and(...conditions))
      .orderBy(feedingSchedules.time);
  }

  /**
   * Get next feeding time for a user
   */
  async getNextFeedingTime(
    userId: string,
    petId?: string
  ): Promise<FeedingSchedule | null> {
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

    const conditions = [
      eq(feedingSchedules.userId, userId),
      eq(feedingSchedules.isActive, true),
      like(feedingSchedules.days, `%${todayName}%`),
    ];

    if (petId) {
      conditions.push(eq(feedingSchedules.petId, petId));
    }


    const [schedule] = await db
      .select()
      .from(feedingSchedules)
      .where(and(...conditions))
      .orderBy(feedingSchedules.time)
      .limit(1);

    return schedule ?? null;
  }
}
