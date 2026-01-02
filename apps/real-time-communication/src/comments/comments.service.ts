import { Injectable } from '@nestjs/common';

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
  constructor(private readonly commentsRepository: CommentsRepository) {}

  create(createCommentDto: CreateCommentDto): Comment {
    const now = new Date();
    const comment = new Comment({
      id: crypto.randomUUID(),
      ...createCommentDto,
      createdAt: now,
      updatedAt: now,
      sentimentScore: getSentimentScore(createCommentDto.content),
    });

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
    return this.commentsRepository.update(id, {
      ...updateCommentDto,
      updatedAt: new Date(),
    });
  }

  remove(id: string): Comment | undefined {
    const now = new Date();
    return this.commentsRepository.update(id, {
      deletedAt: now,
      updatedAt: now,
    });
  }
}
