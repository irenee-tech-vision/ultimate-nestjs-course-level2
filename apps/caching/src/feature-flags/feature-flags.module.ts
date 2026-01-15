import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MongoConnectionModule } from '../mongo-connection/mongo-connection.module';
import { OverridesModule } from '../overrides/overrides.module';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { UserFeatureFlagsController } from './user-feature-flags.controller';

@Module({
  imports: [
    MongoConnectionModule.forFeature({ collectionName: 'feature_flags' }),
    AuthModule,
    OverridesModule,
  ],
  controllers: [FeatureFlagsController, UserFeatureFlagsController],
  providers: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
