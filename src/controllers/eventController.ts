import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { successResponse, errorResponse, getPaginationParams } from '../utils/response';
import { CreateEventRequest, UpdateEventRequest, EventQueryParams } from '../types/api';
import { Event } from '../models/schema';
import { createError } from '../middleware/errorHandler';

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  // GET /api/events OR /api/pets/:petId/events - Get events (optionally filtered by pet)
  getEventsByPetId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Support both URL params (/pets/:petId/events) and query string (/events?petId=...)
      const petId = req.params.petId || (req.query.petId as string);
      const params: EventQueryParams = {
        ...getPaginationParams(req.query),
        type: req.query.type as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const { events, total } = await this.eventService.getEventsByPetId(petId, params);
      const meta = { total, page: params.page!, limit: params.limit!, totalPages: Math.ceil(total / params.limit!) };

      successResponse(res, events, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/events/calendar/:date - Get events for a specific date
  getEventsByDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.params;
      const params: EventQueryParams = {
        ...getPaginationParams(req.query),
        type: req.query.type as string,
      };

      if (!date) {
        throw createError('Date is required', 400, 'MISSING_DATE');
      }

      const { events, total } = await this.eventService.getEventsByDate(date, params);
      const meta = { total, page: params.page!, limit: params.limit!, totalPages: Math.ceil(total / params.limit!) };

      successResponse(res, events, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/events/:id - Get event by ID
  getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Event ID is required', 400, 'MISSING_ID');
      }

      const event = await this.eventService.getEventById(id);

      if (!event) {
        throw createError('Event not found', 404, 'EVENT_NOT_FOUND');
      }

      successResponse(res, event);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/events - Create new event
  createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventData: CreateEventRequest = req.body;

      // Validation
      if (!eventData.petId || !eventData.title || !eventData.type || !eventData.startTime) {
        throw createError('Pet ID, title, type, and start time are required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      // Convert string dates to Date objects
      const convertedEventData = {
        ...eventData,
        startTime: new Date(eventData.startTime),
        ...(eventData.endTime && { endTime: new Date(eventData.endTime) })
      };

      const event = await this.eventService.createEvent(convertedEventData as any);
      successResponse(res, event, 201);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/events/:id - Update event
  updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateEventRequest = req.body;

      if (!id) {
        throw createError('Event ID is required', 400, 'MISSING_ID');
      }

      // Convert string dates to Date objects
      const convertedUpdates = {
        ...updates,
        ...(updates.startTime && { startTime: new Date(updates.startTime) }),
        ...(updates.endTime && { endTime: new Date(updates.endTime) })
      };

      const event = await this.eventService.updateEvent(id, convertedUpdates as any);

      if (!event) {
        throw createError('Event not found', 404, 'EVENT_NOT_FOUND');
      }

      successResponse(res, event);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/events/:id - Delete event
  deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Event ID is required', 400, 'MISSING_ID');
      }

      const deleted = await this.eventService.deleteEvent(id);

      if (!deleted) {
        throw createError('Event not found', 404, 'EVENT_NOT_FOUND');
      }

      successResponse(res, { message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/events/upcoming - Get upcoming events
  getUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const days = parseInt(req.query.days as string) || 7;
      const events = await this.eventService.getUpcomingEvents(petId, days);
      successResponse(res, events);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/events/today - Get today's events
  getTodayEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const events = await this.eventService.getTodayEvents(petId);
      successResponse(res, events);
    } catch (error) {
      next(error);
    }
  };
}