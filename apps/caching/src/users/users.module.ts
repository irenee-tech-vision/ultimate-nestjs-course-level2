import { Module } from '@nestjs/common';
import { MongoConnectionModule } from '../mongo-connection/mongo-connection.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MongoConnectionModule.forFeature({ collectionName: 'users' })],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
