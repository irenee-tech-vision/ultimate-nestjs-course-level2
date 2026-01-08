# Real Time Communication (RTC) with NestJs

This NestJS application is part of my NestJS course for a module on real-time communication.

The goal is to demonstrate how to implement real-time communication with a client via three different approaches:

- Polling (normal REST API calls with some query filters)
- Server-Sent Events (SSE) for unidirectional communication
- WebSockets (via socket.io) for bidirectional communication

## Documentation

See [docs/api-overview.md](docs/01-api-overview.md) for:

- API endpoints with curl examples
- Implementation notes on key patterns used in the codebase

See [docs/client-overview.md](docs/02-client-overview.md) for:

- Client overview
- Client code structure
- Client usage instructions

## Usage

```bash
# start the application
npm run start:dev:rtc

# API tests
npm run test:e2e:rtc

# e2e playwright tests
npm run test:pw:rtc
```
