import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfigService } from './app-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        MONGO_URI: Joi.string()
          .optional()
          .default('mongodb://localhost:27017/feature-flags'),
        CACHE_TTL: Joi.number().optional().default(60000),
        REDIS_URL: Joi.string().optional().default('redis://localhost:6379'),
      }),
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
