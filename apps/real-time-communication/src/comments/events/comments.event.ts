import { Comment } from '../entities/comment.entity';

export const COMMENT_EVENTS = {
  CREATED: 'comment.created',
  UPDATED: 'comment.updated',
  DELETED: 'comment.deleted',
  ALL: 'comment.*',
} as const;

export class CommentCreatedEvent {
  static readonly eventName = COMMENT_EVENTS.CREATED;

  constructor(public readonly comment: Comment) {}
}

export class CommentUpdatedEvent {
  static readonly eventName = COMMENT_EVENTS.UPDATED;

  constructor(public readonly comment: Comment) {}
}

export class CommentDeletedEvent {
  static readonly eventName = COMMENT_EVENTS.DELETED;

  constructor(public readonly comment: Comment) {}
}
