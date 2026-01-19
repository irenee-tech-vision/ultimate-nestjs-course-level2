import {
  Controller,
  Get,
  Header,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FeatureFlagsService } from './feature-flags.service';
import { UserFeatureFlagsCacheInterceptor } from './user-feature-flags-cache.interceptor';

@Controller('me/feature-flags')
@UseInterceptors(UserFeatureFlagsCacheInterceptor)
@UseGuards(ApiKeyGuard)
export class UserFeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Header('Cache-Control', 'no-store')
  @Get()
  findAll(
    @Query('environment') environment: string,
    @CurrentUser() user: User,
  ) {
    return this.featureFlagsService.resolveForUser(
      environment,
      user._id!.toString(),
    );
  }
}
