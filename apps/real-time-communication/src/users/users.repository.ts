import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository implements OnModuleInit {
  private users: User[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    if (this.configService.get<string>('SEED_DATA') === 'true') {
      const { seedUsers } = await import('../../test/fixtures/users.fixture');
      this.seed(seedUsers);
    }
  }

  // CRUD operations
  create(user: User): User {
    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByApiKey(apiKey: string): User | undefined {
    return this.users.find((user) => user.apiKey === apiKey);
  }

  // Testing utilities
  reset(): void {
    this.users = [];
  }

  seed(users: User[]): void {
    this.users = [...users];
  }

  count(): number {
    return this.users.length;
  }
}
