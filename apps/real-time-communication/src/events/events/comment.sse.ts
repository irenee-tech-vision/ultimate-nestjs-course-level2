import { MessageEvent } from '@nestjs/common';
import { Comment } from '../../comments/entities/comment.entity';

interface CommentSseData {
  domain: 'comment';
  type: 'created' | 'updated' | 'deleted';
  payload: Comment;
}

export class CommentSse implements MessageEvent {
  data: CommentSseData;
  id: string;

  constructor(type: CommentSseData['type'], comment: Comment) {
    this.id = crypto.randomUUID();
    this.data = {
      domain: 'comment',
      type,
      payload: comment,
    };
  }
}
