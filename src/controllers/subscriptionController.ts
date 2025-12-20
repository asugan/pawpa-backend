import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { SubscriptionService } from '../services/subscriptionService';
import { successResponse } from '../utils/response';
import { createError } from '../middleware/errorHandler';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * GET /api/subscription/status
   * Get unified subscription status (main endpoint for frontend)
   */
  getSubscriptionStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const deviceId = req.query.deviceId as string | undefined;

      const status = await this.subscriptionService.getSubscriptionStatus(
        userId,
        deviceId
      );
      successResponse(res, status);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/subscription/trial-status
   * @deprecated Use /status instead - kept for backward compatibility
   */
  getTrialStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const deviceId = req.query.deviceId as string | undefined;

      const status = await this.subscriptionService.getSubscriptionStatus(
        userId,
        deviceId
      );

      // Map to old format for backward compatibility
      successResponse(res, {
        hasActiveTrial:
          status.hasActiveSubscription && status.subscriptionType === 'trial',
        trialStartDate: null, // No longer tracked separately
        trialEndDate: status.expiresAt,
        trialDaysRemaining: status.daysRemaining,
        isTrialExpired: status.isExpired,
        canStartTrial: status.canStartTrial,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/subscription/start-trial
   * Start a trial for the current user
   */
  startTrial = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);
      const { deviceId } = req.body as { deviceId?: string };

      if (!deviceId) {
        throw createError('Device ID is required', 400, 'MISSING_DEVICE_ID');
      }

      const subscription = await this.subscriptionService.startTrial(
        userId,
        deviceId
      );

      successResponse(
        res,
        {
          success: true,
          subscription: {
            id: subscription._id,
            provider: subscription.provider,
            tier: subscription.tier,
            status: subscription.status,
            expiresAt: subscription.expiresAt.toISOString(),
          },
        },
        201
      );
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message === 'User already has a subscription') {
          return next(
            createError(
              'User already has a subscription',
              409,
              'SUBSCRIPTION_EXISTS'
            )
          );
        }
        if (error.message === 'Device has already used a trial') {
          return next(
            createError(
              'This device has already used a trial',
              409,
              'DEVICE_TRIAL_USED'
            )
          );
        }
        if (error.message === 'User has already used a trial') {
          return next(
            createError(
              'This user has already used a trial',
              409,
              'USER_TRIAL_USED'
            )
          );
        }
      }
      next(error);
    }
  };


  /**
   * POST /api/subscription/deactivate-trial
   * @deprecated Trial is now automatically converted when RevenueCat subscription is created
   */
  deactivateTrial = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireAuth(req);

      const deactivated =
        await this.subscriptionService.expireInternalTrial(userId);

      if (!deactivated) {
        throw createError('No active trial found', 404, 'NO_ACTIVE_TRIAL');
      }

      successResponse(res, {
        success: true,
        message: 'Trial deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
