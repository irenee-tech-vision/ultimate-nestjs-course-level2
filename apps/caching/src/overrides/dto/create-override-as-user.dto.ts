import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateOverrideAsUserDto {
  /**
   * Reference to the feature flag ID
   */
  @IsString()
  @IsNotEmpty()
  flagId: string;

  /**
   * Override value for the feature flag
   */
  @IsBoolean()
  enabled: boolean;

  /**
   * Environment this override applies to (required)
   * @example "development", "staging", "production"
   */
  @IsString()
  @IsNotEmpty()
  environment: string;
}
