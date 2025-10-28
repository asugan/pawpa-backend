import { eq, like, and, desc, count } from 'drizzle-orm';
import { db, feedingSchedules, pets } from '../config/database';
import { FeedingScheduleQueryParams } from '../types/api';
import { FeedingSchedule, NewFeedingSchedule } from '../models/schema';
import { generateId } from '../utils/id';

export class FeedingScheduleService {
  async getFeedingSchedulesByPetId(petId: string, params: FeedingScheduleQueryParams): Promise<{ schedules: FeedingSchedule[]; total: number }> {
    const { page = 1, limit = 10, isActive, foodType } = params;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(feedingSchedules.petId, petId)];

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

    const total = result[0]?.total || 0;

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

  async getFeedingScheduleById(id: string): Promise<FeedingSchedule | null> {
    const [schedule] = await db
      .select({
        id: feedingSchedules.id,
        petId: feedingSchedules.petId,
        time: feedingSchedules.time,
        foodType: feedingSchedules.foodType,
        amount: feedingSchedules.amount,
        days: feedingSchedules.days,
        isActive: feedingSchedules.isActive,
        createdAt: feedingSchedules.createdAt,
      })
      .from(feedingSchedules)
      .where(eq(feedingSchedules.id, id));

    return schedule || null;
  }

  async createFeedingSchedule(scheduleData: Omit<NewFeedingSchedule, 'id' | 'createdAt'>): Promise<FeedingSchedule> {
    // Verify pet exists
    const [pet] = await db.select().from(pets).where(eq(pets.id, scheduleData.petId));
    if (!pet) {
      throw new Error('Pet not found');
    }

    const newSchedule: NewFeedingSchedule = {
      id: generateId(),
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

  async updateFeedingSchedule(id: string, updates: Partial<NewFeedingSchedule>): Promise<FeedingSchedule | null> {
    const [updatedSchedule] = await db
      .update(feedingSchedules)
      .set(updates)
      .where(eq(feedingSchedules.id, id))
      .returning();

    return updatedSchedule || null;
  }

  async deleteFeedingSchedule(id: string): Promise<boolean> {
    const [deletedSchedule] = await db
      .delete(feedingSchedules)
      .where(eq(feedingSchedules.id, id))
      .returning();

    return !!deletedSchedule;
  }

  async getActiveSchedules(petId?: string): Promise<FeedingSchedule[]> {
    const conditions = [eq(feedingSchedules.isActive, true)];

    if (petId) {
      conditions.push(eq(feedingSchedules.petId, petId));
    }

    return await db
      .select()
      .from(feedingSchedules)
      .where(and(...conditions))
      .orderBy(feedingSchedules.time);
  }

  async getTodaySchedules(petId?: string): Promise<FeedingSchedule[]> {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];

    const conditions = [
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

  async getNextFeedingTime(petId?: string): Promise<FeedingSchedule | null> {
    const today = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];

    const conditions = [
      eq(feedingSchedules.isActive, true),
      like(feedingSchedules.days, `%${todayName}%`),
    ];

    if (petId) {
      conditions.push(eq(feedingSchedules.petId, petId));
    }

    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format

    const [schedule] = await db
      .select()
      .from(feedingSchedules)
      .where(and(...conditions))
      .orderBy(feedingSchedules.time)
      .limit(1);

    return schedule || null;
  }
}