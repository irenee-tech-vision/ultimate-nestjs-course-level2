import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';

import { RealTimeCommunicationModule } from '../src/real-time-communication.module';
import { USERS } from './fixtures/users.fixture';

describe('EventsGateway (e2e)', () => {
  let app: INestApplication;
  let socket: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RealTimeCommunicationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
  }, 10000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  afterEach(() => {
    if (socket?.connected) {
      socket.disconnect();
    }
  });

  const getSocketUrl = () => {
    const address = app.getHttpServer().address();
    return `http://localhost:${address.port}`;
  };

  describe('Connection', () => {
    it('should connect with valid API key', (done) => {
      socket = io(getSocketUrl(), {
        auth: { apiKey: USERS.ALICE.apiKey },
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        done();
      });

      socket.on('connect_error', (err) => {
        done(err);
      });
    });
  });

  describe('Typing Events', () => {
    let socket2: Socket;

    afterEach(() => {
      if (socket2?.connected) {
        socket2.disconnect();
      }
    });

    const connectSocket = (apiKey: string): Promise<Socket> => {
      return new Promise((resolve, reject) => {
        const newSocket = io(getSocketUrl(), {
          auth: { apiKey },
        });

        newSocket.on('connect', () => resolve(newSocket));
        newSocket.on('connect_error', reject);
      });
    };

    it('should broadcast typing:update with isTyping true when typing:start is emitted', async () => {
      socket = await connectSocket(USERS.ALICE.apiKey);
      socket2 = await connectSocket(USERS.BOB.apiKey);

      const typingUpdatePromise = new Promise<any>((resolve) => {
        socket2.on('typing:update', (data) => {
          resolve(data);
        });
      });

      socket.emit('typing:start', {
        taskId: 'task-123',
        userId: USERS.ALICE.id,
        userName: USERS.ALICE.name,
      });

      const receivedData = await typingUpdatePromise;

      expect(receivedData).toEqual({
        taskId: 'task-123',
        userId: USERS.ALICE.id,
        userName: USERS.ALICE.name,
        isTyping: true,
      });
    });

    it('should broadcast typing:update with isTyping false when typing:stop is emitted', async () => {
      socket = await connectSocket(USERS.ALICE.apiKey);
      socket2 = await connectSocket(USERS.BOB.apiKey);

      const typingUpdatePromise = new Promise<any>((resolve) => {
        socket2.on('typing:update', (data) => {
          resolve(data);
        });
      });

      socket.emit('typing:stop', {
        taskId: 'task-123',
        userId: USERS.ALICE.id,
      });

      const receivedData = await typingUpdatePromise;

      expect(receivedData).toEqual({
        taskId: 'task-123',
        userId: USERS.ALICE.id,
        isTyping: false,
      });
    });

    it('should not send typing:update back to the sender', async () => {
      socket = await connectSocket(USERS.ALICE.apiKey);
      socket2 = await connectSocket(USERS.BOB.apiKey);

      let senderReceivedEvent = false;
      socket.on('typing:update', () => {
        senderReceivedEvent = true;
      });

      const receiverPromise = new Promise<void>((resolve) => {
        socket2.on('typing:update', () => {
          resolve();
        });
      });

      socket.emit('typing:start', {
        taskId: 'task-123',
        userId: USERS.ALICE.id,
        userName: USERS.ALICE.name,
      });

      await receiverPromise;

      // Give a small delay to ensure the sender would have received it if it was going to
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(senderReceivedEvent).toBe(false);
    });
  });

});
