import { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, default: 'internal' }, // 'internal' | 'revenuecat'
  revenueCatId: String, // nullable, only for revenuecat subscriptions
  tier: { type: String, default: 'pro' }, // 'pro' (extensible for future tiers)
  status: { type: String, default: 'active' }, // 'active' | 'expired' | 'cancelled'
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true
});

// Compound indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, expiresAt: 1 });

export const SubscriptionModel = model('Subscription', subscriptionSchema);