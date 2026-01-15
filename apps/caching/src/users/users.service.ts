import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoRepository } from '../mongo-connection/mongo.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly repository: MongoRepository<User>) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.repository.create(createUserDto as User);
    return new User(user);
  }

  async findAll() {
    const users = await this.repository.findAll();
    return users.map((user) => new User(user));
  }

  async findOne(id: string) {
    const user = await this.repository.findOneBy({ _id: new ObjectId(id) });
    return user ? new User(user) : null;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.repository.updateOneBy(
      { _id: new ObjectId(id) },
      updateUserDto as Partial<User>,
    );
    return user ? new User(user) : null;
  }

  async remove(id: string) {
    const user = await this.repository.deleteOneBy({ _id: new ObjectId(id) });
    return user ? new User(user) : null;
  }

  async findByApiKey(apiKey: string) {
    const user = await this.repository.findOneBy({ apiKey } as Partial<User>);
    return user ? new User(user) : null;
  }
}
