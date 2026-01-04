import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  COMMENT_EVENTS,
  CommentCreatedEvent,
  CommentDeletedEvent,
  CommentUpdatedEvent,
} from './events/comments.event';
import {
  filterEntities,
  sortEntitiesByLatestChange,
} from '../utils/entity-query.utils';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { getSentimentScore } from './get-sentiment-score';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  create(createCommentDto: CreateCommentDto): Comment {
    const now = new Date();
    const comment = new Comment({
      id: crypto.randomUUID(),
      ...createCommentDto,
      createdAt: now,
      updatedAt: now,
      sentimentScore: getSentimentScore(createCommentDto.content),
    });

    this.eventEmitter.emit(COMMENT_EVENTS.CREATED, new CommentCreatedEvent(comment));
    return this.commentsRepository.create(comment);
  }

  findAll({
    includeDeleted = false,
    changedSince,
  }: {
    includeDeleted?: boolean;
    changedSince?: Date;
  }): Comment[] {
    const allComments = this.commentsRepository.findAll();
    const filtered = filterEntities(allComments, {
      includeDeleted,
      changedSince,
    });
    return sortEntitiesByLatestChange(filtered);
  }

  findByTaskId({
    taskId,
    includeDeleted = false,
    changedSince,
  }: {
    taskId: string;
    includeDeleted?: boolean;
    changedSince?: Date;
  }): Comment[] {
    const taskComments = this.commentsRepository.findByTaskId(taskId);
    const filtered = filterEntities(taskComments, {
      includeDeleted,
      changedSince,
    });
    return sortEntitiesByLatestChange(filtered);
  }

  findOne(id: string): Comment | undefined {
    return this.commentsRepository.findOne(id);
  }

  update(id: string, updateCommentDto: UpdateCommentDto): Comment | undefined {
    const comment = this.commentsRepository.update(id, {
      ...updateCommentDto,
      updatedAt: new Date(),
    });

    if (comment) {
      this.eventEmitter.emit(COMMENT_EVENTS.UPDATED, new CommentUpdatedEvent(comment));
    }

    return comment;
  }

  remove(id: string): Comment | undefined {
    const now = new Date();
    const comment = this.commentsRepository.update(id, {
      deletedAt: now,
      updatedAt: now,
    });

    if (comment) {
      this.eventEmitter.emit(COMMENT_EVENTS.DELETED, new CommentDeletedEvent(comment));
    }

    return comment;
  }
}
