import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsRepository implements OnModuleInit {
  private comments: Comment[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    if (this.configService.get<string>('SEED_DATA') === 'true') {
      const { seedComments } = await import(
        '../../test/fixtures/comments.fixture'
      );
      this.seed(seedComments);
    }
  }

  // CRUD operations
  create(comment: Comment): Comment {
    this.comments.push(comment);
    return comment;
  }

  findAll(): Comment[] {
    return this.comments;
  }

  findOne(id: string): Comment | undefined {
    return this.comments.find((comment) => comment.id === id);
  }

  findOneActive(id: string): Comment | undefined {
    return this.comments.find((comment) => comment.id === id && !comment.deletedAt);
  }

  findByTaskId(taskId: string): Comment[] {
    return this.comments.filter((comment) => comment.taskId === taskId);
  }

  update(id: string, updates: Partial<Comment>): Comment | undefined {
    const commentIndex = this.comments.findIndex(
      (comment) => comment.id === id && !comment.deletedAt,
    );
    if (commentIndex === -1) {
      return undefined;
    }
    this.comments[commentIndex] = {
      ...this.comments[commentIndex],
      ...updates,
    };
    return this.comments[commentIndex];
  }

  // Testing utilities
  reset(): void {
    this.comments = [];
  }

  seed(comments: Comment[]): void {
    this.comments = [...comments];
  }

  count(): number {
    return this.comments.length;
  }
}
