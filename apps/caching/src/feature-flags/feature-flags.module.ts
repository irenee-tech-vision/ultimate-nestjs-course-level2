import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MongoConnectionModule } from '../mongo-connection/mongo-connection.module';
import { OverridesModule } from '../overrides/overrides.module';
import { FeatureFlagsCacheService } from './feature-flags-cache.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { UserFeatureFlagsController } from './user-feature-flags.controller';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [
    AppConfigModule,
    MongoConnectionModule.forFeature({ collectionName: 'feature_flags' }),
    AuthModule,
    OverridesModule,
  ],
  controllers: [FeatureFlagsController, UserFeatureFlagsController],
  providers: [FeatureFlagsService, FeatureFlagsCacheService],
})
export class FeatureFlagsModule {}
