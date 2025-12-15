import { EventModel } from '../models/mongoose/event';
import { PetModel } from '../models/mongoose/pet';
import { EventQueryParams } from '../types/api';
import {
  getUTCTodayBoundaries,
  getUTCUpcomingBoundaries,
  parseUTCDate,
} from '../lib/dateUtils';

export class EventService {
  /**
   * Get events for a user, optionally filtered by petId
   */
  async getEventsByPetId(
    userId: string,
    petId?: string,
    params?: EventQueryParams
  ): Promise<{ events: any[]; total: number }> {
    const { page = 1, limit = 10, type, startDate, endDate } = params ?? {};
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const whereClause: any = { userId };

    if (petId) {
      whereClause.petId = petId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.$gte = parseUTCDate(startDate);
      }
      if (endDate) {
        whereClause.startTime.$lte = parseUTCDate(endDate);
      }
    }

    // Get total count
    const total = await EventModel.countDocuments(whereClause);

    // Get events with pagination
    const eventsList = await EventModel.find(whereClause)
      .sort({ startTime: 1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return {
      events: eventsList,
      total,
    };
  }

  /**
   * Get events for a specific date for a user
   */
  async getEventsByDate(
    userId: string,
    date: string,
    params: EventQueryParams
  ): Promise<{ events: any[]; total: number }> {
    const { page = 1, limit = 10, type } = params;
    const offset = (page - 1) * limit;

    // Parse the date and get next day in UTC
    const startDate = parseUTCDate(date);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    // Build where conditions using UTC boundaries
    const whereClause: any = {
      userId,
      startTime: {
        $gte: startDate,
        $lt: endDate
      }
    };

    if (type) {
      whereClause.type = type;
    }

    // Get total count
    const total = await EventModel.countDocuments(whereClause);

    // Get events with pagination
    const eventsList = await EventModel.find(whereClause)
      .sort({ startTime: 1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return {
      events: eventsList,
      total,
    };
  }

  /**
   * Get event by ID, ensuring it belongs to the user
   */
  async getEventById(userId: string, id: string): Promise<any | null> {
    const event = await EventModel.findOne({ _id: id, userId }).exec();
    return event ?? null;
  }

  /**
   * Create event, ensuring the pet belongs to the user
   */
  async createEvent(
    userId: string,
    eventData: any
  ): Promise<any> {
    // Verify pet exists and belongs to user
    const pet = await PetModel.findOne({ _id: eventData.petId, userId }).exec();

    if (!pet) {
      throw new Error('Pet not found');
    }

    const newEvent = new EventModel({ ...eventData, userId });
    const createdEvent = await newEvent.save();

    if (!createdEvent) {
      throw new Error('Failed to create event');
    }
    return createdEvent;
  }

  /**
   * Update event, ensuring it belongs to the user
   */
  async updateEvent(
    userId: string,
    id: string,
    updates: Partial<any>
  ): Promise<any | null> {
    // Don't allow updating userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _userId, ...safeUpdates } = updates;

    const updatedEvent = await EventModel.findOneAndUpdate(
      { _id: id, userId },
      safeUpdates,
      { new: true }
    ).exec();

    return updatedEvent ?? null;
  }

  /**
   * Delete event, ensuring it belongs to the user
   */
  async deleteEvent(userId: string, id: string): Promise<boolean> {
    const deletedEvent = await EventModel.findOneAndDelete({ _id: id, userId }).exec();
    return !!deletedEvent;
  }

  /**
   * Get upcoming events for a user (UTC-based)
   * @param userId - User ID
   * @param petId - Optional pet ID to filter by
   * @param days - Number of days to look ahead (1-365, default: 7)
   * @returns Array of upcoming events
   */
  async getUpcomingEvents(
    userId: string,
    petId?: string,
    days = 7
  ): Promise<any[]> {
    // Parameter validation
    if (days < 1) {
      throw new Error('Days parameter must be at least 1');
    }
    if (days > 365) {
      throw new Error('Days parameter cannot exceed 365');
    }

    // Get UTC boundaries for the date range
    const boundaries = getUTCUpcomingBoundaries(days);

    const whereClause: any = {
      userId,
      startTime: {
        $gte: new Date(boundaries.gte),
        $lte: new Date(boundaries.lte)
      }
    };

    if (petId) {
      whereClause.petId = petId;
    }

    return await EventModel.find(whereClause)
      .sort({ startTime: 1 })
      .exec();
  }

  /**
   * Get today's events for a user (UTC-based)
   */
  async getTodayEvents(userId: string, petId?: string): Promise<any[]> {
    const todayBoundary = getUTCTodayBoundaries();

    const whereClause: any = {
      userId,
      startTime: {
        $gte: new Date(todayBoundary.gte),
        $lte: new Date(todayBoundary.lte)
      }
    };

    if (petId) {
      whereClause.petId = petId;
    }

    return await EventModel.find(whereClause)
      .sort({ startTime: 1 })
      .exec();
  }
}
