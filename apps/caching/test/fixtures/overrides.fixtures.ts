import { ObjectId } from 'mongodb';
import { Override } from '../../src/overrides/entities/override.entity';
import { USERS } from './users.fixtures';
import { FEATURE_FLAGS } from './feature-flags.fixtures';

export function createOverrideFixture(override?: Partial<Override>): Override {
  return new Override({
    _id: new ObjectId(),
    flagId: FEATURE_FLAGS.DARK_MODE._id!.toHexString(),
    enabled: true,
    environment: 'development',
    ...override,
  });
}

// Environment-only overrides (apply to ALL users in that environment)
// These overrides have no userId - they serve as defaults for the entire environment
export const ENVIRONMENT_OVERRIDES = {
  // Dark mode disabled for all production users (overrides flag default of true)
  DARK_MODE_PRODUCTION: createOverrideFixture({
    _id: new ObjectId('6963b058e057444db7a995a7'),
    flagId: FEATURE_FLAGS.DARK_MODE._id!.toHexString(),
    enabled: false,
    environment: 'production',
    // No userId - applies to all users in production
  }),
  // Beta features disabled in production for everyone
  BETA_FEATURES_PRODUCTION: createOverrideFixture({
    _id: new ObjectId('6963b05e4604767d6d7c3e0d'),
    flagId: FEATURE_FLAGS.BETA_FEATURES._id!.toHexString(),
    enabled: false,
    environment: 'production',
  }),
  // New checkout enabled in staging for all users
  NEW_CHECKOUT_STAGING: createOverrideFixture({
    _id: new ObjectId('6963b064253846bc4e66eadf'),
    flagId: FEATURE_FLAGS.NEW_CHECKOUT._id!.toHexString(),
    enabled: true,
    environment: 'staging',
  }),
} as const;

// User-specific overrides (apply to specific user in specific environment)
// These overrides have both environment AND userId
export const USER_OVERRIDES = {
  // Alice's overrides in development
  ALICE_DARK_MODE_DEV: createOverrideFixture({
    _id: new ObjectId('69638c1f244e890d9de1287a'),
    userId: USERS.ALICE._id!.toHexString(),
    flagId: FEATURE_FLAGS.DARK_MODE._id!.toHexString(),
    enabled: true,
    environment: 'development',
  }),
  ALICE_NEW_CHECKOUT_DEV: createOverrideFixture({
    _id: new ObjectId('69638c6ffbc9e44eb2dae4f0'),
    userId: USERS.ALICE._id!.toHexString(),
    flagId: FEATURE_FLAGS.NEW_CHECKOUT._id!.toHexString(),
    enabled: true,
    environment: 'development',
  }),
  // Alice gets beta features in production (overrides env-level disable)
  ALICE_BETA_FEATURES_PROD: createOverrideFixture({
    _id: new ObjectId('69638c73f0886982cc31a1e3'),
    userId: USERS.ALICE._id!.toHexString(),
    flagId: FEATURE_FLAGS.BETA_FEATURES._id!.toHexString(),
    enabled: true,
    environment: 'production',
  }),
  ALICE_ANALYTICS_V2_DEV: createOverrideFixture({
    _id: new ObjectId('69638c78d1ff92575c17eddb'),
    userId: USERS.ALICE._id!.toHexString(),
    flagId: FEATURE_FLAGS.ANALYTICS_V2._id!.toHexString(),
    enabled: false,
    environment: 'development',
  }),
  // Bob's overrides
  BOB_DARK_MODE_DEV: createOverrideFixture({
    _id: new ObjectId('69638c7e4e1989628bcf9e8b'),
    userId: USERS.BOB._id!.toHexString(),
    flagId: FEATURE_FLAGS.DARK_MODE._id!.toHexString(),
    enabled: false,
    environment: 'development',
  }),
  BOB_NEW_CHECKOUT_STAGING: createOverrideFixture({
    _id: new ObjectId('69638c8255ce785ec76f1590'),
    userId: USERS.BOB._id!.toHexString(),
    flagId: FEATURE_FLAGS.NEW_CHECKOUT._id!.toHexString(),
    enabled: false,
    environment: 'staging',
  }),
  BOB_BETA_FEATURES_DEV: createOverrideFixture({
    _id: new ObjectId('69638c87444a9b0f6da6ad6b'),
    userId: USERS.BOB._id!.toHexString(),
    flagId: FEATURE_FLAGS.BETA_FEATURES._id!.toHexString(),
    enabled: false,
    environment: 'development',
  }),
  BOB_ANALYTICS_V2_STAGING: createOverrideFixture({
    _id: new ObjectId('69638c8e5cdd1c00c4794109'),
    userId: USERS.BOB._id!.toHexString(),
    flagId: FEATURE_FLAGS.ANALYTICS_V2._id!.toHexString(),
    enabled: true,
    environment: 'staging',
  }),
  // Charlie's overrides
  CHARLIE_DARK_MODE_PROD: createOverrideFixture({
    _id: new ObjectId('69638c93fc8da35018dcb747'),
    userId: USERS.CHARLIE._id!.toHexString(),
    flagId: FEATURE_FLAGS.DARK_MODE._id!.toHexString(),
    enabled: true,
    environment: 'production',
  }),
  CHARLIE_NEW_CHECKOUT_DEV: createOverrideFixture({
    _id: new ObjectId('69638c9ad796659c8b5e3c6a'),
    userId: USERS.CHARLIE._id!.toHexString(),
    flagId: FEATURE_FLAGS.NEW_CHECKOUT._id!.toHexString(),
    enabled: false,
    environment: 'development',
  }),
  CHARLIE_BETA_FEATURES_DEV: createOverrideFixture({
    _id: new ObjectId('69638ca035e299213bc442a7'),
    userId: USERS.CHARLIE._id!.toHexString(),
    flagId: FEATURE_FLAGS.BETA_FEATURES._id!.toHexString(),
    enabled: true,
    environment: 'development',
  }),
  CHARLIE_ANALYTICS_V2_DEV: createOverrideFixture({
    _id: new ObjectId('69638ca635cf11e8fffce694'),
    userId: USERS.CHARLIE._id!.toHexString(),
    flagId: FEATURE_FLAGS.ANALYTICS_V2._id!.toHexString(),
    enabled: false,
    environment: 'development',
  }),
} as const;

// Combined for backward compatibility
export const FEATURE_FLAG_OVERRIDES = {
  ...ENVIRONMENT_OVERRIDES,
  ...USER_OVERRIDES,
} as const;

export const seedEnvironmentOverrides = (): Override[] =>
  Object.values(ENVIRONMENT_OVERRIDES);

export const seedUserOverrides = (): Override[] =>
  Object.values(USER_OVERRIDES);

export const seedStaticOverrides = (): Override[] =>
  Object.values(FEATURE_FLAG_OVERRIDES);
