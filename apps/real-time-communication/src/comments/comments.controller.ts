import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FindCommentsQueryDto } from './dto/find-comments-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  findAll(@Query() query: FindCommentsQueryDto) {
    const { includeDeleted, changedSince, taskId } = query;
    if (taskId) {
      return this.commentsService.findByTaskId({
        taskId,
        includeDeleted,
        changedSince,
      });
    }

    return this.commentsService.findAll({ includeDeleted, changedSince });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const comment = this.commentsService.findOne(id);
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return comment;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    const comment = this.commentsService.update(id, updateCommentDto);
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return comment;
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    const comment = this.commentsService.findOne(id);
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (comment.authorId !== user.id) {
      throw new ForbiddenException(
        'Only the comment author can delete this comment',
      );
    }

    const deletedComment = this.commentsService.remove(id);
    // NOTE: This could happen if the comment was already deleted
    if (!deletedComment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return deletedComment;
  }
}
