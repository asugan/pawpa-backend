import { Request, Response, NextFunction } from 'express';
import { FeedingScheduleService } from '../services/feedingScheduleService';
import { successResponse, errorResponse, getPaginationParams } from '../utils/response';
import { CreateFeedingScheduleRequest, UpdateFeedingScheduleRequest, FeedingScheduleQueryParams } from '../types/api';
import { FeedingSchedule } from '../models/schema';
import { createError } from '../middleware/errorHandler';

export class FeedingScheduleController {
  private feedingScheduleService: FeedingScheduleService;

  constructor() {
    this.feedingScheduleService = new FeedingScheduleService();
  }

  // GET /api/pets/:petId/feeding-schedules - Get feeding schedules for a pet
  getFeedingSchedulesByPetId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { petId } = req.params;
      const params: FeedingScheduleQueryParams = {
        ...getPaginationParams(req.query),
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        foodType: req.query.foodType as string,
      };

      if (!petId) {
        throw createError('Pet ID is required', 400, 'MISSING_PET_ID');
      }

      const { schedules, total } = await this.feedingScheduleService.getFeedingSchedulesByPetId(petId, params);
      const meta = { total, page: params.page!, limit: params.limit!, totalPages: Math.ceil(total / params.limit!) };

      successResponse(res, schedules, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/feeding-schedules/:id - Get feeding schedule by ID
  getFeedingScheduleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Feeding schedule ID is required', 400, 'MISSING_ID');
      }

      const schedule = await this.feedingScheduleService.getFeedingScheduleById(id);

      if (!schedule) {
        throw createError('Feeding schedule not found', 404, 'FEEDING_SCHEDULE_NOT_FOUND');
      }

      successResponse(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/feeding-schedules - Create new feeding schedule
  createFeedingSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scheduleData: CreateFeedingScheduleRequest = req.body;

      // Validation
      if (!scheduleData.petId || !scheduleData.time || !scheduleData.foodType || !scheduleData.amount || !scheduleData.days) {
        throw createError('Pet ID, time, food type, amount, and days are required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      const schedule = await this.feedingScheduleService.createFeedingSchedule(scheduleData);
      successResponse(res, schedule, 201);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/feeding-schedules/:id - Update feeding schedule
  updateFeedingSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateFeedingScheduleRequest = req.body;

      if (!id) {
        throw createError('Feeding schedule ID is required', 400, 'MISSING_ID');
      }

      const schedule = await this.feedingScheduleService.updateFeedingSchedule(id, updates);

      if (!schedule) {
        throw createError('Feeding schedule not found', 404, 'FEEDING_SCHEDULE_NOT_FOUND');
      }

      successResponse(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/feeding-schedules/:id - Delete feeding schedule
  deleteFeedingSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Feeding schedule ID is required', 400, 'MISSING_ID');
      }

      const deleted = await this.feedingScheduleService.deleteFeedingSchedule(id);

      if (!deleted) {
        throw createError('Feeding schedule not found', 404, 'FEEDING_SCHEDULE_NOT_FOUND');
      }

      successResponse(res, { message: 'Feeding schedule deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/feeding-schedules/active - Get all active feeding schedules
  getActiveSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const schedules = await this.feedingScheduleService.getActiveSchedules(petId);
      successResponse(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/feeding-schedules/today - Get today's feeding schedules
  getTodaySchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const schedules = await this.feedingScheduleService.getTodaySchedules(petId);
      successResponse(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/feeding-schedules/next - Get next feeding time
  getNextFeedingTime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const schedule = await this.feedingScheduleService.getNextFeedingTime(petId);
      successResponse(res, schedule);
    } catch (error) {
      next(error);
    }
  };
}