import { Exclude } from 'class-transformer';

export class Task {
  id: string;
  assigneeId?: string;
  assigneeName?: string;
  title: string;
  description: string;
  status: 'to-do' | 'in-progress' | 'blocked' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  @Exclude()
  internalPriority?: number;

  constructor(partial: Partial<Task>) {
    Object.assign(this, partial);
  }
}
