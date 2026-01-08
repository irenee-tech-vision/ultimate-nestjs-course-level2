import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class FindCommentsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDeleted?: boolean;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  changedSince?: Date;
}
