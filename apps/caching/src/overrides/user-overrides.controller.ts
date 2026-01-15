import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateOverrideAsUserDto } from './dto/create-override-as-user.dto';
import { UpdateOverrideAsUserDto } from './dto/update-override-as-user.dto';
import { OverridesService } from './overrides.service';

@Controller('me/overrides')
@UseGuards(ApiKeyGuard)
export class UserOverridesController {
  constructor(private readonly overridesService: OverridesService) {}

  @Post()
  create(
    @Body() createOverrideAsUserDto: CreateOverrideAsUserDto,
    @CurrentUser() user: User,
  ) {
    return this.overridesService.createForUser(
      createOverrideAsUserDto,
      user._id!.toString(),
    );
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.overridesService.findAllByUserId(user._id!.toString());
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.overridesService.findOneByIdAndUserId(id, user._id!.toString());
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOverrideAsUserDto: UpdateOverrideAsUserDto,
    @CurrentUser() user: User,
  ) {
    return this.overridesService.updateByIdAndUserId(
      id,
      updateOverrideAsUserDto,
      user._id!.toString(),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.overridesService.removeByIdAndUserId(id, user._id!.toString());
  }
}
