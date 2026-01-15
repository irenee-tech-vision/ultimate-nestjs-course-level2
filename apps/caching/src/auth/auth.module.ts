import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [UsersModule],
  providers: [ApiKeyGuard],
  exports: [UsersModule, ApiKeyGuard],
})
export class AuthModule {}
