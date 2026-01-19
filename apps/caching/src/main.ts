import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { CachingModule } from './caching.module';


async function bootstrap() {
  const app = await NestFactory.create(CachingModule);
  app.enableShutdownHooks();

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Explicitly disable ETag on the underlying Express app
  // app.getHttpAdapter().getInstance().set('etag', false);
  
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
