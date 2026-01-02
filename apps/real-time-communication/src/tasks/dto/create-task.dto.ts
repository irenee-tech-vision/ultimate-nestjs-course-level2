export class CreateTaskDto {
  assigneeId?: string;
  title: string;
  description: string;
  status: 'to-do' | 'in-progress' | 'blocked' | 'completed';
}
