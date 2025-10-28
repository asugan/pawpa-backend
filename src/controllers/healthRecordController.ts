import { Request, Response, NextFunction } from 'express';
import { HealthRecordService } from '../services/healthRecordService';
import { successResponse, errorResponse, getPaginationParams } from '../utils/response';
import { CreateHealthRecordRequest, UpdateHealthRecordRequest, HealthRecordQueryParams } from '../types/api';
import { HealthRecord } from '../models/schema';
import { createError } from '../middleware/errorHandler';

export class HealthRecordController {
  private healthRecordService: HealthRecordService;

  constructor() {
    this.healthRecordService = new HealthRecordService();
  }

  // GET /api/pets/:petId/health-records - Get health records for a pet
  getHealthRecordsByPetId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { petId } = req.params;
      const params: HealthRecordQueryParams = {
        ...getPaginationParams(req.query),
        type: req.query.type as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      if (!petId) {
        throw createError('Pet ID is required', 400, 'MISSING_PET_ID');
      }

      const { records, total } = await this.healthRecordService.getHealthRecordsByPetId(petId, params);
      const meta = { total, page: params.page!, limit: params.limit!, totalPages: Math.ceil(total / params.limit!) };

      successResponse(res, records, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/health-records/:id - Get health record by ID
  getHealthRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Health record ID is required', 400, 'MISSING_ID');
      }

      const record = await this.healthRecordService.getHealthRecordById(id);

      if (!record) {
        throw createError('Health record not found', 404, 'HEALTH_RECORD_NOT_FOUND');
      }

      successResponse(res, record);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/health-records - Create new health record
  createHealthRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recordData: CreateHealthRecordRequest = req.body;

      // Validation
      if (!recordData.petId || !recordData.type || !recordData.title || !recordData.date) {
        throw createError('Pet ID, type, title, and date are required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      // Convert string dates to Date objects
      const convertedRecordData = {
        ...recordData,
        date: new Date(recordData.date),
        ...(recordData.nextDueDate && { nextDueDate: new Date(recordData.nextDueDate) })
      };

      const record = await this.healthRecordService.createHealthRecord(convertedRecordData as any);
      successResponse(res, record, 201);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/health-records/:id - Update health record
  updateHealthRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateHealthRecordRequest = req.body;

      if (!id) {
        throw createError('Health record ID is required', 400, 'MISSING_ID');
      }

      // Convert string dates to Date objects
      const convertedUpdates = {
        ...updates,
        ...(updates.date && { date: new Date(updates.date) }),
        ...(updates.nextDueDate && { nextDueDate: new Date(updates.nextDueDate) })
      };

      const record = await this.healthRecordService.updateHealthRecord(id, convertedUpdates as any);

      if (!record) {
        throw createError('Health record not found', 404, 'HEALTH_RECORD_NOT_FOUND');
      }

      successResponse(res, record);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/health-records/:id - Delete health record
  deleteHealthRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Health record ID is required', 400, 'MISSING_ID');
      }

      const deleted = await this.healthRecordService.deleteHealthRecord(id);

      if (!deleted) {
        throw createError('Health record not found', 404, 'HEALTH_RECORD_NOT_FOUND');
      }

      successResponse(res, { message: 'Health record deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/health-records/upcoming - Get upcoming vaccinations
  getUpcomingVaccinations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petId = req.query.petId as string;
      const vaccinations = await this.healthRecordService.getUpcomingVaccinations(petId);
      successResponse(res, vaccinations);
    } catch (error) {
      next(error);
    }
  };
}