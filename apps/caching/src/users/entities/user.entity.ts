import { Exclude, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';

export class User {
  @Transform(({ value }) => value?.toString())
  _id?: ObjectId;

  name: string;

  @Exclude()
  apiKey: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
