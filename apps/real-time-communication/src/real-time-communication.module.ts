import { Module } from '@nestjs/common';
import { RealTimeCommunicationController } from './real-time-communication.controller';
import { RealTimeCommunicationService } from './real-time-communication.service';

@Module({
  imports: [],
  controllers: [RealTimeCommunicationController],
  providers: [RealTimeCommunicationService],
})
export class RealTimeCommunicationModule {}
