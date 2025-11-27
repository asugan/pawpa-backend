import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import petRoutes from './petRoutes';
import healthRecordRoutes from './healthRecordRoutes';
import eventRoutes from './eventRoutes';
import feedingScheduleRoutes from './feedingScheduleRoutes';
import expenseRoutes from './expenseRoutes';
import budgetRoutes from './budgetRoutes';

const router = Router();

// All API routes require authentication
router.use(requireAuth);

// Mount routes
router.use('/pets', petRoutes);
router.use('/health-records', healthRecordRoutes);
router.use('/events', eventRoutes);
router.use('/feeding-schedules', feedingScheduleRoutes);
router.use('/expenses', expenseRoutes);
router.use('/budget-limits', budgetRoutes);

// Pet-specific nested routes
router.use('/pets/:petId/health-records', healthRecordRoutes);
router.use('/pets/:petId/events', eventRoutes);
router.use('/pets/:petId/feeding-schedules', feedingScheduleRoutes);
router.use('/pets/:petId/expenses', expenseRoutes);
router.use('/pets/:petId/budget-limits', budgetRoutes);

export default router;