import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeCommunicationController } from './real-time-communication.controller';
import { RealTimeCommunicationService } from './real-time-communication.service';

describe('RealTimeCommunicationController', () => {
  let realTimeCommunicationController: RealTimeCommunicationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RealTimeCommunicationController],
      providers: [RealTimeCommunicationService],
    }).compile();

    realTimeCommunicationController = app.get<RealTimeCommunicationController>(RealTimeCommunicationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(realTimeCommunicationController.getHello()).toBe('Hello World!');
    });
  });
});
