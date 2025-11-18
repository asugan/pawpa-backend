import { eq, like, and, desc, count, gte, lte } from 'drizzle-orm';
import { db, healthRecords, pets } from '../config/database';
import { HealthRecordQueryParams } from '../types/api';
import { HealthRecord, NewHealthRecord } from '../models/schema';
import { generateId } from '../utils/id';

export class HealthRecordService {
  async getHealthRecordsByPetId(petId?: string, params?: HealthRecordQueryParams): Promise<{ records: HealthRecord[]; total: number }> {
    const { page = 1, limit = 10, type, startDate, endDate } = params || {};
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Only filter by petId if provided
    if (petId) {
      conditions.push(eq(healthRecords.petId, petId));
    }

    if (type) {
      conditions.push(eq(healthRecords.type, type));
    }

    if (startDate) {
      conditions.push(gte(healthRecords.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(healthRecords.date, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async getHealthRecordById(id: string): Promise<HealthRecord | null> {
    const [record] = await db
      .select({
        id: healthRecords.id,
        petId: healthRecords.petId,
        type: healthRecords.type,
        title: healthRecords.title,
        description: healthRecords.description,
        date: healthRecords.date,
        veterinarian: healthRecords.veterinarian,
        clinic: healthRecords.clinic,
        cost: healthRecords.cost,
        nextDueDate: healthRecords.nextDueDate,
        attachments: healthRecords.attachments,
        vaccineName: healthRecords.vaccineName,
        vaccineManufacturer: healthRecords.vaccineManufacturer,
        batchNumber: healthRecords.batchNumber,
        createdAt: healthRecords.createdAt,
      })
      .from(healthRecords)
      .where(eq(healthRecords.id, id));

    return record || null;
  }

  async createHealthRecord(recordData: Omit<NewHealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> {
    // Verify pet exists
    const [pet] = await db.select().from(pets).where(eq(pets.id, recordData.petId));
    if (!pet) {
      throw new Error('Pet not found');
    }

    const newRecord: NewHealthRecord = {
      id: generateId(),
      ...recordData,
      createdAt: new Date(),
    };

    const result = await db
      .insert(healthRecords)
      .values(newRecord)
      .returning();

    const createdRecord = result[0];
    if (!createdRecord) {
      throw new Error('Failed to create health record');
    }
    return createdRecord;
  }

  async updateHealthRecord(id: string, updates: Partial<NewHealthRecord>): Promise<HealthRecord | null> {
    const [updatedRecord] = await db
      .update(healthRecords)
      .set(updates)
      .where(eq(healthRecords.id, id))
      .returning();

    return updatedRecord || null;
  }

  async deleteHealthRecord(id: string): Promise<boolean> {
    const [deletedRecord] = await db
      .delete(healthRecords)
      .where(eq(healthRecords.id, id))
      .returning();

    return !!deletedRecord;
  }

  async getUpcomingVaccinations(petId?: string): Promise<HealthRecord[]> {
    const now = new Date();
    const conditions = [eq(healthRecords.type, 'vaccination'), gte(healthRecords.nextDueDate, now)];

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