import { NextFunction, Response, Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { HealthRecordController } from '../controllers/healthRecordController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { validateObjectId } from '../utils/mongodb-validation';

const router = Router({ mergeParams: true });
const healthRecordController = new HealthRecordController();

// Validation schemas
const createHealthRecordSchema = z.object({
  petId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid pet ID format'),
  type: z.enum([
    'vaccination',
    'checkup',
    'medication',
    'surgery',
    'dental',
    'grooming',
    'other',
  ]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().datetime('Invalid date format'),
  veterinarian: z.string().optional(),
  clinic: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  nextDueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
  // Vaccination specific fields
  vaccineName: z.string().optional(),
  vaccineManufacturer: z.string().optional(),
  batchNumber: z.string().optional(),
  // Medication specific fields
  medicationName: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  // Legacy field
  attachments: z.string().optional(),
});

const updateHealthRecordSchema = createHealthRecordSchema.partial();

// Routes
router.get('/upcoming', healthRecordController.getUpcomingVaccinations);

// GET / - If called as /api/health-records, use getAllHealthRecords (accepts petId as query param)
// GET / - If called as /api/pets/:petId/health-records, use getHealthRecordsByPetId (gets petId from params)
router.get('/', (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check if petId exists in params (nested route) or query (standalone route)
  if (req.params.petId) {
    return healthRecordController.getHealthRecordsByPetId(req, res, next);
  } else {
    return healthRecordController.getAllHealthRecords(req, res, next);
  }
});

router.get('/:id', validateObjectId(), healthRecordController.getHealthRecordById);

router.post(
  '/',
  validateRequest(createHealthRecordSchema),
  healthRecordController.createHealthRecord
);

router.put(
  '/:id',
  validateObjectId(),
  validateRequest(updateHealthRecordSchema),
  healthRecordController.updateHealthRecord
);

router.delete('/:id', validateObjectId(), healthRecordController.deleteHealthRecord);

export default router;
