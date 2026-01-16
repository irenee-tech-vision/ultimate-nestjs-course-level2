import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '../app-config/app-config.module';
import { AppConfigService } from '../app-config/app-config.service';
import { CacheInvalidationListener } from './cache-invalidation.listener';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [AppConfigModule],
      useFactory: (appConfig: AppConfigService) => ({
        ttl: appConfig.cacheTtl,
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [CacheInvalidationListener],
})
export class AppCachingModule {}
