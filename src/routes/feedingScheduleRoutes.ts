import { Router } from 'express';
import { FeedingScheduleController } from '../controllers/feedingScheduleController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const feedingScheduleController = new FeedingScheduleController();

// Validation schemas
const createFeedingScheduleSchema = z.object({
  petId: z.string().min(1, 'Pet ID is required'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  foodType: z.string().min(1, 'Food type is required'),
  amount: z.string().min(1, 'Amount is required'),
  days: z.string().min(1, 'Days are required'),
  isActive: z.boolean().optional(),
});

const updateFeedingScheduleSchema = createFeedingScheduleSchema.partial();

// Routes
router.get('/active', feedingScheduleController.getActiveSchedules);

router.get('/today', feedingScheduleController.getTodaySchedules);

router.get('/next', feedingScheduleController.getNextFeedingTime);

router.get('/:id', feedingScheduleController.getFeedingScheduleById);

router.post('/', validateRequest(createFeedingScheduleSchema), feedingScheduleController.createFeedingSchedule);

router.put('/:id', validateRequest(updateFeedingScheduleSchema), feedingScheduleController.updateFeedingSchedule);

router.delete('/:id', feedingScheduleController.deleteFeedingSchedule);

export default router;