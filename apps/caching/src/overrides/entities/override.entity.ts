import { Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';

export class Override {
  @Transform(({ value }) => value?.toString())
  _id?: ObjectId;

  /**
   * Reference to the feature flag
   */
  flagId: string;

  /**
   * Override value for the feature flag
   */
  enabled: boolean;

  /**
   * Environment this override applies to
   * @example "development", "staging", "production"
   */
  environment: string;

  /**
   * User ID this override applies to (optional)
   * If not set, applies to ALL users in the environment
   * If set, applies only to this specific user in the environment
   */
  userId?: string;

  constructor(partial: Partial<Override>) {
    Object.assign(this, partial);
  }
}
