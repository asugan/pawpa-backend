import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { validateObjectId } from '../utils/mongodb-validation';

const router = Router({ mergeParams: true });
const eventController = new EventController();

// Validation schemas
const createEventSchema = z.object({
  petId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid pet ID format'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format').optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  reminder: z.boolean().optional(),
});

const updateEventSchema = createEventSchema.partial();

const dateParamSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
});

// Routes
router.get('/upcoming', eventController.getUpcomingEvents);

router.get('/today', eventController.getTodayEvents);

router.get(
  '/calendar/:date',
  validateRequest(dateParamSchema, 'params'),
  eventController.getEventsByDate
);

router.get('/', eventController.getEventsByPetId);

router.get('/:id', validateObjectId(), eventController.getEventById);

router.post(
  '/',
  validateRequest(createEventSchema),
  eventController.createEvent
);

router.put(
  '/:id',
  validateObjectId(),
  validateRequest(updateEventSchema),
  eventController.updateEvent
);

router.delete('/:id', validateObjectId(), eventController.deleteEvent);

export default router;
