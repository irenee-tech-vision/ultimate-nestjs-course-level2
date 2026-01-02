import { Controller, Get } from '@nestjs/common';
import { RealTimeCommunicationService } from './real-time-communication.service';

@Controller()
export class RealTimeCommunicationController {
  constructor(private readonly realTimeCommunicationService: RealTimeCommunicationService) {}

  @Get()
  getHello(): string {
    return this.realTimeCommunicationService.getHello();
  }
}
