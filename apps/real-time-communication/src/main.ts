import { NestFactory } from '@nestjs/core';
import { RealTimeCommunicationModule } from './real-time-communication.module';

async function bootstrap() {
  const app = await NestFactory.create(RealTimeCommunicationModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
