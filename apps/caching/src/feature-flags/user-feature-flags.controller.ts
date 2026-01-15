import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FeatureFlagsService } from './feature-flags.service';

@Controller('me/feature-flags')
@UseGuards(ApiKeyGuard)
export class UserFeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  findAll(@Query('environment') environment: string, @CurrentUser() user: User) {
    return this.featureFlagsService.resolveForUser(
      environment,
      user._id!.toString(),
    );
  }
}
