import { Exclude } from 'class-transformer';

export class User {
  id: string;
  name: string;

  @Exclude()
  apiKey: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
