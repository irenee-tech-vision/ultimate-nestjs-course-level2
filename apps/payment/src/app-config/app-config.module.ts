import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfigService } from './app-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        ORM_HOST: Joi.string().default('localhost'),
        ORM_PORT: Joi.number().positive().default(5432),
        ORM_PASSWORD: Joi.string().required(),
        ORM_USERNAME: Joi.string().default('postgres'),
        ORM_DATABASE: Joi.string().default('postgres'),
        ORM_AUTO_LOAD_ENTITIES: Joi.boolean().default(true),
        ORM_SYNCHRONIZE: Joi.boolean().default(false),
      }),
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
