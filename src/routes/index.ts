import { Router } from 'express';
import petRoutes from './petRoutes';
import healthRecordRoutes from './healthRecordRoutes';
import eventRoutes from './eventRoutes';
import feedingScheduleRoutes from './feedingScheduleRoutes';

const router = Router();

// Mount routes
router.use('/pets', petRoutes);
router.use('/health-records', healthRecordRoutes);
router.use('/events', eventRoutes);
router.use('/feeding-schedules', feedingScheduleRoutes);

// Pet-specific nested routes
router.use('/pets/:petId/health-records', healthRecordRoutes);
router.use('/pets/:petId/events', eventRoutes);
router.use('/pets/:petId/feeding-schedules', feedingScheduleRoutes);

export default router;