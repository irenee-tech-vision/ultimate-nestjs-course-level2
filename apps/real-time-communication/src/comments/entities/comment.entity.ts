import { Exclude } from 'class-transformer';

export class Comment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  @Exclude()
  sentimentScore?: number;

  constructor(partial: Partial<Comment>) {
    Object.assign(this, partial);
  }
}
