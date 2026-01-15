import { Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';

export class FeatureFlag {
  @Transform(({ value }) => value?.toString())
  _id?: ObjectId;

  /**
   * @example "dark-mode", "new-checkout"
   */
  name: string;

  /**
   * global default value for the feature flag
   */
  enabled: boolean;

  /**
   * @example "This feature flag is used to enable/disable the dark mode"
   */
  description?: string;

  constructor(partial: Partial<FeatureFlag>) {
    Object.assign(this, partial);
  }
}
