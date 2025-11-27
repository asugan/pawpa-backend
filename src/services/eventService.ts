import { eq, and, count, gte, lte } from 'drizzle-orm';
import { db, events, pets } from '../config/database';
import { EventQueryParams } from '../types/api';
import { Event, NewEvent } from '../models/schema';
import { generateId } from '../utils/id';

export class EventService {
  /**
   * Get events for a user, optionally filtered by petId
   */
  async getEventsByPetId(userId: string, petId?: string, params?: EventQueryParams): Promise<{ events: Event[]; total: number }> {
    const { page = 1, limit = 10, type, startDate, endDate } = params || {};
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const conditions = [eq(events.userId, userId)];

    if (petId) {
      conditions.push(eq(events.petId, petId));
    }

    if (type) {
      conditions.push(eq(events.type, type));
    }

    if (startDate) {
      conditions.push(gte(events.startTime, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(events.startTime, new Date(endDate)));
    }

    const whereClause = and(...conditions);

    // Get total count
    const result = await db
      .select({ total: count() })
      .from(events)
      .where(whereClause);

    const total = result[0]?.total || 0;

    // Get events with pagination
    const eventsList = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(events.startTime)
      .limit(limit)
      .offset(offset);

    return {
      events: eventsList,
      total,
    };
  }

  /**
   * Get events for a specific date for a user
   */
  async getEventsByDate(userId: string, date: string, params: EventQueryParams): Promise<{ events: Event[]; total: number }> {
    const { page = 1, limit = 10, type } = params;
    const offset = (page - 1) * limit;
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build where conditions
    const conditions = [
      eq(events.userId, userId),
      gte(events.startTime, targetDate),
      lte(events.startTime, nextDay),
    ];

    if (type) {
      conditions.push(eq(events.type, type));
    }

    const whereClause = and(...conditions);

    // Get total count
    const result = await db
      .select({ total: count() })
      .from(events)
      .where(whereClause);

    const total = result[0]?.total || 0;

    // Get events with pagination
    const eventsList = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(events.startTime)
      .limit(limit)
      .offset(offset);

    return {
      events: eventsList,
      total,
    };
  }

  /**
   * Get event by ID, ensuring it belongs to the user
   */
  async getEventById(userId: string, id: string): Promise<Event | null> {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));

    return event || null;
  }

  /**
   * Create event, ensuring the pet belongs to the user
   */
  async createEvent(userId: string, eventData: Omit<NewEvent, 'id' | 'userId' | 'createdAt'>): Promise<Event> {
    // Verify pet exists and belongs to user
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, eventData.petId), eq(pets.userId, userId)));

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newEvent: NewEvent = {
      id: generateId(),
      userId,
      ...eventData,
      createdAt: new Date(),
    };

    const result = await db
      .insert(events)
      .values(newEvent)
      .returning();

    const createdEvent = result[0];
    if (!createdEvent) {
      throw new Error('Failed to create event');
    }
    return createdEvent;
  }

  /**
   * Update event, ensuring it belongs to the user
   */
  async updateEvent(userId: string, id: string, updates: Partial<NewEvent>): Promise<Event | null> {
    // Don't allow updating userId
    const { userId: _, ...safeUpdates } = updates as any;

    const [updatedEvent] = await db
      .update(events)
      .set(safeUpdates)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();

    return updatedEvent || null;
  }

  /**
   * Delete event, ensuring it belongs to the user
   */
  async deleteEvent(userId: string, id: string): Promise<boolean> {
    const [deletedEvent] = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();

    return !!deletedEvent;
  }

  /**
   * Get upcoming events for a user
   */
  async getUpcomingEvents(userId: string, petId?: string, days: number = 7): Promise<Event[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    const conditions = [
      eq(events.userId, userId),
      gte(events.startTime, now),
      lte(events.startTime, futureDate)
    ];

    if (petId) {
      conditions.push(eq(events.petId, petId));
    }

    return await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startTime);
  }

  /**
   * Get today's events for a user
   */
  async getTodayEvents(userId: string, petId?: string): Promise<Event[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const conditions = [
      eq(events.userId, userId),
      gte(events.startTime, today),
      lte(events.startTime, tomorrow),
    ];

    if (petId) {
      conditions.push(eq(events.petId, petId));
    }

    return await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startTime);
  }
}
