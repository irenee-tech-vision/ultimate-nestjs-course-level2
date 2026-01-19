import { PartialType } from '@nestjs/mapped-types';
import { CreateOverrideAsUserDto } from './create-override-as-user.dto';

export class UpdateOverrideAsUserDto extends PartialType(
  CreateOverrideAsUserDto,
) {}
