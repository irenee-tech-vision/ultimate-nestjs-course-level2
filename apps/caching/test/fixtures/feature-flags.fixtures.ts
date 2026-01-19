import { ObjectId } from 'mongodb';
import { FeatureFlag } from '../../src/feature-flags/entities/feature-flag.entity';

function randomString(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createFeatureFlagFixture(
  overrides: Partial<FeatureFlag> = {},
): FeatureFlag {
  return {
    _id: new ObjectId(),
    name: `feature-${randomString()}`,
    enabled: Math.random() > 0.5,
    description: `Test feature flag ${randomString()}`,
    ...overrides,
  };
}

export function createFeatureFlags(count: number = 100): FeatureFlag[] {
  const flags: FeatureFlag[] = [];

  for (let i = 0; i < count; i++) {
    flags.push(createFeatureFlagFixture());
  }

  return flags;
}

export const FEATURE_FLAGS = {
  DARK_MODE: createFeatureFlagFixture({
    _id: new ObjectId('69638c074bd8d55689493b79'),
    name: 'dark-mode',
    enabled: true,
    description: 'Enable dark mode UI theme',
  }),
  NEW_CHECKOUT: createFeatureFlagFixture({
    _id: new ObjectId('69638c0f8ddccddd5e3926a2'),
    name: 'new-checkout',
    enabled: false,
    description: 'New checkout flow',
  }),
  BETA_FEATURES: createFeatureFlagFixture({
    _id: new ObjectId('69638c15dc2ee0c07d70f3b2'),
    name: 'beta-features',
    enabled: true,
    description: 'Access to beta features',
  }),
  ANALYTICS_V2: createFeatureFlagFixture({
    _id: new ObjectId('69638c1aa42935fdb5c91de2'),
    name: 'analytics-v2',
    enabled: false,
    description: 'New analytics dashboard',
  }),
} as const;

export const seedFeatureFlags = (): FeatureFlag[] =>
  Object.values(FEATURE_FLAGS);
