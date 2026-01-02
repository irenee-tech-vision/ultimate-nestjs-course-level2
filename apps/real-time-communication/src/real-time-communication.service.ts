import { Injectable } from '@nestjs/common';

@Injectable()
export class RealTimeCommunicationService {
  getHello(): string {
    return 'Hello World!';
  }
}
