import { Module } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  providers: [CommentsRepository, CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
