import { Module } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [CommentsRepository, CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
