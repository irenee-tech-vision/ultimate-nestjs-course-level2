import { IsString } from 'class-validator';

export class TypingStopDto {
  @IsString()
  taskId: string;

  @IsString()
  userId: string;
}
