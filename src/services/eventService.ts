import { eq, like, and, desc, count, gte, lte } from 'drizzle-orm';
import { db, events, pets } from '../config/database';
import { EventQueryParams } from '../types/api';
import { Event, NewEvent } from '../models/schema';
import { generateId } from '../utils/id';

export class EventService {
  async getEventsByPetId(petId?: string, params?: EventQueryParams): Promise<{ events: Event[]; total: number }> {
    const { page = 1, limit = 10, type, startDate, endDate } = params || {};
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Only filter by petId if provided
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async getEventsByDate(date: string, params: EventQueryParams): Promise<{ events: Event[]; total: number }> {
    const { page = 1, limit = 10, type } = params;
    const offset = (page - 1) * limit;
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build where conditions
    const conditions = [
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

  async getEventById(id: string): Promise<Event | null> {
    const [event] = await db
      .select({
        id: events.id,
        petId: events.petId,
        title: events.title,
        description: events.description,
        type: events.type,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        notes: events.notes,
        reminder: events.reminder,
        createdAt: events.createdAt,
      })
      .from(events)
      .where(eq(events.id, id));

    return event || null;
  }

  async createEvent(eventData: Omit<NewEvent, 'id' | 'createdAt'>): Promise<Event> {
    // Verify pet exists
    const [pet] = await db.select().from(pets).where(eq(pets.id, eventData.petId));
    if (!pet) {
      throw new Error('Pet not found');
    }

    const newEvent: NewEvent = {
      id: generateId(),
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

  async updateEvent(id: string, updates: Partial<NewEvent>): Promise<Event | null> {
    const [updatedEvent] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();

    return updatedEvent || null;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();

    return !!deletedEvent;
  }

  async getUpcomingEvents(petId?: string, days: number = 7): Promise<Event[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    const conditions = [gte(events.startTime, now), lte(events.startTime, futureDate)];

    if (petId) {
      conditions.push(eq(events.petId, petId));
    }

    return await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startTime);
  }

  async getTodayEvents(petId?: string): Promise<Event[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const conditions = [
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