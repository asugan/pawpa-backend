import { and, eq, gt } from 'drizzle-orm';
import {
  Subscription,
  db,
  deviceTrialRegistry,
  subscriptions,
} from '../config/database';
import { generateId } from '../utils/id';
import {
  SUBSCRIPTION_CONFIG,
  SUBSCRIPTION_PROVIDERS,
  SUBSCRIPTION_STATUSES,
} from '../config/subscriptionConfig';

/**
 * Unified subscription status - single source of truth for frontend
 */
export interface UnifiedSubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionType: 'trial' | 'paid' | null;
  tier: string | null;
  expiresAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  isCancelled: boolean;
  canStartTrial: boolean;
  provider: 'internal' | 'revenuecat' | null;
}

export interface DeviceEligibility {
  canStartTrial: boolean;
  reason?: string;
  existingTrialUserId?: string;
}

export class SubscriptionService {
  /**
   * Get unified subscription status for a user
   * This is the main endpoint - frontend should use this for all status checks
   */
  async getSubscriptionStatus(
    userId: string,
    deviceId?: string
  ): Promise<UnifiedSubscriptionStatus> {
    // Get the user's active subscription (either internal trial or revenuecat)
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, SUBSCRIPTION_STATUSES.ACTIVE),
          gt(subscriptions.expiresAt, new Date())
        )
      );

    if (!subscription) {
      // No active subscription - check if there's an expired one
      const [expiredSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      // Check if device can start trial
      const canStartTrial = deviceId
        ? await this.checkDeviceCanStartTrial(deviceId)
        : !expiredSubscription; // Can start if no previous subscription exists

      return {
        hasActiveSubscription: false,
        subscriptionType: null,
        tier: null,
        expiresAt: null,
        daysRemaining: 0,
        isExpired: !!expiredSubscription,
        isCancelled:
          expiredSubscription?.status === SUBSCRIPTION_STATUSES.CANCELLED,
        canStartTrial,
        provider: null,
      };
    }

    const expiresAt = new Date(subscription.expiresAt);
    const daysRemaining = SUBSCRIPTION_CONFIG.getDaysRemaining(expiresAt);

    return {
      hasActiveSubscription: true,
      subscriptionType:
        subscription.provider === SUBSCRIPTION_PROVIDERS.INTERNAL
          ? 'trial'
          : 'paid',
      tier: subscription.tier,
      expiresAt: expiresAt.toISOString(),
      daysRemaining,
      isExpired: false,
      isCancelled: false,
      canStartTrial: false, // Already has subscription
      provider: subscription.provider as 'internal' | 'revenuecat',
    };
  }

  /**
   * Check if a device has already used a trial
   */
  async checkDeviceCanStartTrial(deviceId: string): Promise<boolean> {
    const [existingDevice] = await db
      .select()
      .from(deviceTrialRegistry)
      .where(eq(deviceTrialRegistry.deviceId, deviceId));

    return !existingDevice;
  }

  /**
   * Check device eligibility with detailed info
   */
  async checkDeviceEligibility(deviceId: string): Promise<DeviceEligibility> {
    const [existingDevice] = await db
      .select()
      .from(deviceTrialRegistry)
      .where(eq(deviceTrialRegistry.deviceId, deviceId));

    if (existingDevice) {
      return {
        canStartTrial: false,
        reason: 'Device has already used a trial',
        existingTrialUserId: existingDevice.firstTrialUserId,
      };
    }

    return {
      canStartTrial: true,
    };
  }

  /**
   * Start an internal trial for a user
   */
  async startTrial(userId: string, deviceId: string): Promise<Subscription> {
    // Check if user already has any subscription
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (existingSubscription) {
      throw new Error('User already has a subscription');
    }

    // Check if device has already used a trial
    const [existingDevice] = await db
      .select()
      .from(deviceTrialRegistry)
      .where(eq(deviceTrialRegistry.deviceId, deviceId));

    if (existingDevice) {
      throw new Error('Device has already used a trial');
    }

    const now = new Date();
    const expiresAt = SUBSCRIPTION_CONFIG.getTrialEndDate(now);

    // Create subscription with provider='internal'
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        id: generateId(),
        userId,
        provider: SUBSCRIPTION_PROVIDERS.INTERNAL,
        revenueCatId: null,
        tier: SUBSCRIPTION_CONFIG.TIERS.PRO,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!newSubscription) {
      throw new Error('Failed to create subscription');
    }

    // Register device to prevent future trials
    await db.insert(deviceTrialRegistry).values({
      id: generateId(),
      deviceId,
      firstTrialUserId: userId,
      trialUsedAt: now,
      createdAt: now,
    });

    return newSubscription;
  }

  /**
   * Upsert a RevenueCat subscription
   * Called from webhook handler when a purchase/renewal/cancellation occurs
   */
  async upsertRevenueCatSubscription(
    userId: string,
    revenueCatId: string,
    expiresAt: Date,
    status: string
  ): Promise<Subscription> {
    const now = new Date();

    // Check if user already has a subscription
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (existingSubscription) {
      // Update existing subscription to RevenueCat
      const [updatedSubscription] = await db
        .update(subscriptions)
        .set({
          provider: SUBSCRIPTION_PROVIDERS.REVENUECAT,
          revenueCatId,
          status,
          expiresAt,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, existingSubscription.id))
        .returning();

      return updatedSubscription ?? null;
    }

    // Create new RevenueCat subscription
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        id: generateId(),
        userId,
        provider: SUBSCRIPTION_PROVIDERS.REVENUECAT,
        revenueCatId,
        tier: SUBSCRIPTION_CONFIG.TIERS.PRO,
        status,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return newSubscription ?? null;
  }

  /**
   * Update subscription status (used by webhook for cancellation/expiration)
   */
  async updateSubscriptionStatus(
    revenueCatId: string,
    status: string,
    expiresAt?: Date
  ): Promise<Subscription | null> {
    const now = new Date();

    const updateData: { status: string; updatedAt: Date; expiresAt?: Date } = {
      status,
      updatedAt: now,
    };

    if (expiresAt) {
      updateData.expiresAt = expiresAt;
    }

    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.revenueCatId, revenueCatId))
      .returning();

    return updatedSubscription ?? null;
  }

  /**
   * Expire internal trial when user subscribes via RevenueCat
   */
  async expireInternalTrial(userId: string): Promise<boolean> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.provider, SUBSCRIPTION_PROVIDERS.INTERNAL),
          eq(subscriptions.status, SUBSCRIPTION_STATUSES.ACTIVE)
        )
      );

    if (!subscription) {
      return false;
    }

    await db
      .update(subscriptions)
      .set({
        status: SUBSCRIPTION_STATUSES.EXPIRED,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    return true;
  }

  /**
   * Get subscription by user ID
   */
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    return subscription ?? null;
  }

  /**
   * Find user ID by RevenueCat app user ID
   * RevenueCat sends app_user_id in webhooks which should match our userId
   */
  findUserByRevenueCatAppUserId(
    appUserId: string
  ): string | null {
    // In our case, app_user_id is the same as userId
    return appUserId;
  }
}
