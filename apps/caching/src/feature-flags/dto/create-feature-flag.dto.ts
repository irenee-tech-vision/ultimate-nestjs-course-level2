import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureFlagDto {
  /**
   * @example "dark-mode", "new-checkout"
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * global default value for the feature flag
   */
  @IsBoolean()
  enabled: boolean;

  /**
   * @example "This feature flag is used to enable/disable the dark mode"
   */
  @IsString()
  @IsOptional()
  description?: string;
}
