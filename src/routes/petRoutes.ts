import { Router } from 'express';
import { PetController } from '../controllers/petController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const petController = new PetController();

// Validation schemas
const createPetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  breed: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  weight: z.number().positive().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  profilePhoto: z.string().url().optional().nullable(),
});

const updatePetSchema = createPetSchema.partial();

const updatePhotoSchema = z.object({
  photoUrl: z.string().url('Invalid photo URL'),
});

// Routes
router.get('/', petController.getAllPets);

router.get('/:id', petController.getPetById);

router.post('/', validateRequest(createPetSchema), petController.createPet);

router.put('/:id', validateRequest(updatePetSchema), petController.updatePet);

router.delete('/:id', petController.deletePet);

router.post('/:id/photo', validateRequest(updatePhotoSchema), petController.updatePetPhoto);

// Health records sub-routes
router.get('/:id/health-records', petController.getPetHealthRecords);

export default router;