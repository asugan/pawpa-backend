import { Request, Response, NextFunction } from 'express';
import { PetService } from '../services/petService';
import { HealthRecordService } from '../services/healthRecordService';
import { successResponse, errorResponse, getPaginationParams } from '../utils/response';
import { CreatePetRequest, UpdatePetRequest, PetQueryParams, Pet } from '../types/api';
import { createError } from '../middleware/errorHandler';

export class PetController {
  private petService: PetService;
  private healthRecordService: HealthRecordService;

  constructor() {
    this.petService = new PetService();
    this.healthRecordService = new HealthRecordService();
  }

  // GET /api/pets - Get all pets
  getAllPets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params: PetQueryParams = {
        ...getPaginationParams(req.query),
        type: req.query.type as string,
        breed: req.query.breed as string,
        gender: req.query.gender as string,
      };

      const { pets, total } = await this.petService.getAllPets(params);
      const page = params.page || 1;
      const limit = params.limit || 10;
      const meta = { total, page, limit, totalPages: Math.ceil(total / limit) };

      successResponse(res, pets, 200, meta);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/pets/:id - Get pet by ID
  getPetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Pet ID is required', 400, 'MISSING_ID');
      }

      const pet = await this.petService.getPetById(id);

      if (!pet) {
        throw createError('Pet not found', 404, 'PET_NOT_FOUND');
      }

      successResponse(res, pet);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/pets - Create new pet
  createPet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const petData: CreatePetRequest = req.body;

      // Validation
      if (!petData.name || !petData.type) {
        throw createError('Name and type are required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      // Convert string dates to Date objects
      const convertedPetData = {
        ...petData,
        ...(petData.birthDate && { birthDate: new Date(petData.birthDate) })
      };

      const pet = await this.petService.createPet(convertedPetData as any);
      successResponse(res, pet, 201);
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/pets/:id - Update pet
  updatePet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdatePetRequest = req.body;

      if (!id) {
        throw createError('Pet ID is required', 400, 'MISSING_ID');
      }

      // Convert string dates to Date objects
      const convertedUpdates = {
        ...updates,
        ...(updates.birthDate && { birthDate: new Date(updates.birthDate) })
      };

      const pet = await this.petService.updatePet(id, convertedUpdates as any);

      if (!pet) {
        throw createError('Pet not found', 404, 'PET_NOT_FOUND');
      }

      successResponse(res, pet);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/pets/:id - Delete pet
  deletePet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Pet ID is required', 400, 'MISSING_ID');
      }

      const deleted = await this.petService.deletePet(id);

      if (!deleted) {
        throw createError('Pet not found', 404, 'PET_NOT_FOUND');
      }

      successResponse(res, { message: 'Pet deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/pets/:id/photo - Update pet photo
  updatePetPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { photoUrl } = req.body;

      if (!id) {
        throw createError('Pet ID is required', 400, 'MISSING_ID');
      }

      if (!photoUrl) {
        throw createError('Photo URL is required', 400, 'MISSING_PHOTO_URL');
      }

      const pet = await this.petService.updatePetPhoto(id, photoUrl);

      if (!pet) {
        throw createError('Pet not found', 404, 'PET_NOT_FOUND');
      }

      successResponse(res, pet);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/pets/:id/health-records - Get pet's health records
  getPetHealthRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('Pet ID is required', 400, 'MISSING_ID');
      }

      // Optional query parameters for filtering
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50, // Get more records for mobile app
        type: req.query.type as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const healthRecords = await this.healthRecordService.getHealthRecordsByPetId(id, params);

      successResponse(res, healthRecords.records);
    } catch (error) {
      next(error);
    }
  };
}