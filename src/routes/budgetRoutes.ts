import { Router } from 'express';
import { BudgetController } from '../controllers/budgetController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router({ mergeParams: true });
const budgetController = new BudgetController();

// Validation schemas
const expenseCategories = [
  'food',
  'premium_food',
  'veterinary',
  'vaccination',
  'medication',
  'grooming',
  'toys',
  'accessories',
  'training',
  'insurance',
  'emergency',
  'other'
] as const;

const createBudgetLimitSchema = z.object({
  petId: z.string().min(1, 'Pet ID is required'),
  category: z.enum(expenseCategories).optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., TRY, USD, EUR)').default('TRY'),
  period: z.enum(['monthly', 'yearly'], { message: 'Period must be either "monthly" or "yearly"' }),
  alertThreshold: z.number().min(0).max(1, 'Alert threshold must be between 0 and 1').default(0.8),
  isActive: z.boolean().optional().default(true),
});

const updateBudgetLimitSchema = z.object({
  category: z.enum(expenseCategories).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  period: z.enum(['monthly', 'yearly']).optional(),
  alertThreshold: z.number().min(0).max(1, 'Alert threshold must be between 0 and 1').optional(),
  isActive: z.boolean().optional(),
});

// Special routes (must come before parameterized routes)
router.get('/active', budgetController.getActiveBudgetLimits);
router.get('/alerts', budgetController.checkBudgetAlerts);

// Standard CRUD routes
router.get('/', budgetController.getBudgetLimitsByPetId);
router.get('/:id', budgetController.getBudgetLimitById);
router.get('/:id/status', budgetController.getBudgetStatus);
router.post('/', validateRequest(createBudgetLimitSchema), budgetController.createBudgetLimit);
router.put('/:id', validateRequest(updateBudgetLimitSchema), budgetController.updateBudgetLimit);
router.delete('/:id', budgetController.deleteBudgetLimit);

export default router;
