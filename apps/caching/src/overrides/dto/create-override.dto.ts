import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOverrideDto {
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
   * Environment this override applies to
   * @example "development", "staging", "production"
   */
  @IsString()
  @IsNotEmpty()
  environment: string;

  /**
   * User ID this override applies to
   * If not provided, override applies to ALL users in the environment
   */
  @IsString()
  @IsOptional()
  userId?: string;
}
