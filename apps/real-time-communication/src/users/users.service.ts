import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  create(createUserDto: CreateUserDto) {
    const user = new User({
      id: crypto.randomUUID(),
      name: createUserDto.name,
      apiKey: crypto.randomUUID(),
    });
    return this.usersRepository.create(user);
  }

  findAll() {
    return this.usersRepository.findAll();
  }

  findOne(id: string) {
    return this.usersRepository.findOne(id);
  }

  findByApiKey(apiKey: string) {
    return this.usersRepository.findByApiKey(apiKey);
  }
}
