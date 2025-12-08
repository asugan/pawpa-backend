import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { db, healthRecords, pets } from '../config/database';
import { HealthRecordQueryParams } from '../types/api';
import { HealthRecord, NewHealthRecord } from '../models/schema';
import { generateId } from '../utils/id';
import { parseUTCDate, toUTCISOString } from '../lib/dateUtils';

export class HealthRecordService {
  /**
   * Get health records for a user, optionally filtered by petId
   */
  async getHealthRecordsByPetId(
    userId: string,
    petId?: string,
    params?: HealthRecordQueryParams
  ): Promise<{ records: HealthRecord[]; total: number }> {
    const { page = 1, limit = 10, type, startDate, endDate } = params || {};
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const conditions = [eq(healthRecords.userId, userId)];

    if (petId) {
      conditions.push(eq(healthRecords.petId, petId));
    }

    if (type) {
      conditions.push(eq(healthRecords.type, type));
    }

    if (startDate) {
      conditions.push(gte(healthRecords.date, parseUTCDate(startDate)));
    }

    if (endDate) {
      conditions.push(lte(healthRecords.date, parseUTCDate(endDate)));
    }

    const whereClause = and(...conditions);

    // Get total count
    const result = await db
      .select({ total: count() })
      .from(healthRecords)
      .where(whereClause);

    const total = result[0]?.total || 0;

    // Get records with pagination
    const records = await db
      .select()
      .from(healthRecords)
      .where(whereClause)
      .orderBy(desc(healthRecords.date))
      .limit(limit)
      .offset(offset);

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
  ): Promise<HealthRecord | null> {
    const [record] = await db
      .select()
      .from(healthRecords)
      .where(and(eq(healthRecords.id, id), eq(healthRecords.userId, userId)));

    return record || null;
  }

  /**
   * Create health record, ensuring the pet belongs to the user
   */
  async createHealthRecord(
    userId: string,
    recordData: Omit<NewHealthRecord, 'id' | 'userId' | 'createdAt'>
  ): Promise<HealthRecord> {
    // Verify pet exists and belongs to user
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, recordData.petId), eq(pets.userId, userId)));

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newRecord: NewHealthRecord = {
      id: generateId(),
      userId,
      ...recordData,
      createdAt: new Date(),
    };

    const result = await db.insert(healthRecords).values(newRecord).returning();

    const createdRecord = result[0];
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
    updates: Partial<NewHealthRecord>
  ): Promise<HealthRecord | null> {
    // Don't allow updating userId
    const { userId: _, ...safeUpdates } = updates as any;

    const [updatedRecord] = await db
      .update(healthRecords)
      .set(safeUpdates)
      .where(and(eq(healthRecords.id, id), eq(healthRecords.userId, userId)))
      .returning();

    return updatedRecord || null;
  }

  /**
   * Delete health record, ensuring it belongs to the user
   */
  async deleteHealthRecord(userId: string, id: string): Promise<boolean> {
    const [deletedRecord] = await db
      .delete(healthRecords)
      .where(and(eq(healthRecords.id, id), eq(healthRecords.userId, userId)))
      .returning();

    return !!deletedRecord;
  }

  /**
   * Get upcoming vaccinations for a user
   */
  async getUpcomingVaccinations(
    userId: string,
    petId?: string
  ): Promise<HealthRecord[]> {
    const now = new Date();
    const conditions = [
      eq(healthRecords.userId, userId),
      eq(healthRecords.type, 'vaccination'),
      gte(healthRecords.nextDueDate, now),
    ];

    if (petId) {
      conditions.push(eq(healthRecords.petId, petId));
    }

    return await db
      .select()
      .from(healthRecords)
      .where(and(...conditions))
      .orderBy(healthRecords.nextDueDate);
  }
}
