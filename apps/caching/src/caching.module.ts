import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { MongoConnectionModule } from './mongo-connection/mongo-connection.module';
import { OverridesModule } from './overrides/overrides.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

const CLIENT_ROOT_PATH = join(
  __dirname,
  '../../..',
  'apps',
  'caching',
  'client',
);

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: CLIENT_ROOT_PATH,
    }),
    MongoConnectionModule.forRoot(),
    FeatureFlagsModule,
    OverridesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class CachingModule {}
