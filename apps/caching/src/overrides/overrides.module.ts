import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MongoConnectionModule } from '../mongo-connection/mongo-connection.module';
import { AdminOverridesController } from './admin-overrides.controller';
import { UserOverridesController } from './user-overrides.controller';
import { OverridesService } from './overrides.service';

@Module({
  imports: [
    MongoConnectionModule.forFeature({
      collectionName: 'overrides',
    }),
    AuthModule,
  ],
  controllers: [AdminOverridesController, UserOverridesController],
  providers: [OverridesService],
  exports: [OverridesService],
})
export class OverridesModule {}
