import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsGateway } from './events.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [EventsService, EventsGateway],
  exports: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
