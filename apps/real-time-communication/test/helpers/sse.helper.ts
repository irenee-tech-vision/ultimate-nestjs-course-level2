import { INestApplication } from '@nestjs/common';
import { filter, firstValueFrom, ReplaySubject, take, timeout } from 'rxjs';
import * as request from 'supertest';

export interface SseEventData {
  type: string;
  domain?: string;
  payload: any;
}

export interface SseClient {
  waitForEvent: (
    predicate: (event: SseEventData) => boolean,
    timeoutMs?: number,
  ) => Promise<SseEventData>;
  close: () => void;
}

/**
 * Creates an SSE client for testing event streams.
 *
 * @example
 * ```ts
 * const sse = await createSseClient(ctx.app, USERS.ALICE.apiKey).connect();
 *
 * await request(ctx.app.getHttpServer())
 *   .post('/api/tasks')
 *   .send({ title: 'New Task' });
 *
 * const event = await sse.waitForEvent(e => e.domain === 'task');
 * expect(event.type).toBe('created');
 *
 * sse.close();
 * ```
 */
export function createSseClient(
  app: INestApplication,
  apiKey: string,
): { connect: () => Promise<SseClient> } {
  return {
    connect: () =>
      new Promise((resolve, reject) => {
        const events$ = new ReplaySubject<SseEventData>(10);

        const connectionTimeout = setTimeout(() => {
          reject(new Error('SSE connection timeout'));
        }, 5000);

        request(app.getHttpServer())
          .get('/api/events')
          .set('x-api-key', apiKey)
          .set('Accept', 'text/event-stream')
          .buffer(true)
          .parse((res: any, callback) => {
            res.on('data', (chunk: Buffer) => {
              clearTimeout(connectionTimeout);

              const dataMatch = chunk.toString().match(/data: (.+)/);
              if (dataMatch) {
                try {
                  events$.next(JSON.parse(dataMatch[1]));
                } catch {
                  // Ignore malformed events
                }
              }
            });

            res.on('error', (err: Error) => events$.error(err));

            res.once('data', () => {
              resolve({
                waitForEvent: (
                  predicate: (event: SseEventData) => boolean,
                  timeoutMs = 5000,
                ) =>
                  firstValueFrom(
                    events$.pipe(
                      filter(predicate),
                      take(1),
                      timeout(timeoutMs),
                    ),
                  ),
                close: () => {
                  res.destroy();
                  callback(null, {});
                  events$.complete();
                },
              });
            });
          })
          .catch(reject);
      }),
  };
}
