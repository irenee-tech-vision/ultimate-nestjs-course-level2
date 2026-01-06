import { IsString } from 'class-validator';

export class TypingStartDto {
  @IsString()
  taskId: string;
  
  @IsString()
  userId: string;
  
  @IsString()
  userName: string;
}
