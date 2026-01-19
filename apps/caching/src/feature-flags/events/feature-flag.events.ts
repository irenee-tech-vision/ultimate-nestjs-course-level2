import { FeatureFlag } from '../entities/feature-flag.entity';

export const FEATURE_FLAG_EVENTS = {
  CREATED: 'feature-flag.created',
  UPDATED: 'feature-flag.updated',
  DELETED: 'feature-flag.deleted',
  ALL: 'feature-flag.*',
} as const;

export class FeatureFlagCreatedEvent {
  static readonly eventName = FEATURE_FLAG_EVENTS.CREATED;
  constructor(public readonly flag: FeatureFlag) {}
}

export class FeatureFlagUpdatedEvent {
  static readonly eventName = FEATURE_FLAG_EVENTS.UPDATED;
  constructor(public readonly flag: FeatureFlag) {}
}

export class FeatureFlagDeletedEvent {
  static readonly eventName = FEATURE_FLAG_EVENTS.DELETED;
  constructor(public readonly flag: FeatureFlag) {}
}
