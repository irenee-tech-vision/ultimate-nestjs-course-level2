# API Overview

## Quick Start

```bash
# Start the application
npm run start:dev real-time-communication

# Base URL
http://localhost:3000/api
```

## Authentication

All endpoints require an API key. Provide it via:

- **Header:** `X-Api-Key: <your-api-key>`
- **Cookie:** `apiKey=<your-api-key>` (for browser clients)

### Test API Keys

| User    | API Key       | User ID                              |
|---------|---------------|--------------------------------------|
| Alice   | alice-1234    | a1b2c3d4-e5f6-7890-abcd-ef1234567890 |
| Bob     | bob-1234      | b2c3d4e5-f6a7-8901-bcde-f12345678901 |
| Charlie | charlie-1234  | c3d4e5f6-a7b8-9012-cdef-123456789012 |

## Endpoints

### Users

```bash
# List all users
curl http://localhost:3000/api/users -H "X-Api-Key: alice-1234"

# Get a specific user
curl http://localhost:3000/api/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "X-Api-Key: alice-1234"
```

### Tasks

```bash
# List all tasks
curl http://localhost:3000/api/tasks -H "X-Api-Key: alice-1234"

# List tasks changed since a specific time (for polling)
curl "http://localhost:3000/api/tasks?changedSince=2024-01-01T00:00:00.000Z" \
  -H "X-Api-Key: alice-1234"

# Get a specific task
curl http://localhost:3000/api/tasks/{taskId} -H "X-Api-Key: alice-1234"

# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "X-Api-Key: alice-1234" \
  -H "Content-Type: application/json" \
  -d '{"title": "New task", "description": "Task description", "status": "to-do"}'

# Update a task
curl -X PATCH http://localhost:3000/api/tasks/{taskId} \
  -H "X-Api-Key: alice-1234" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title"}'

# Assign a task
curl -X PATCH http://localhost:3000/api/tasks/{taskId}/assign \
  -H "X-Api-Key: alice-1234" \
  -H "Content-Type: application/json" \
  -d '{"assigneeId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"}'

# Change task status
curl -X PATCH http://localhost:3000/api/tasks/{taskId}/status \
  -H "X-Api-Key: alice-1234" \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'

# Delete a task
curl -X DELETE http://localhost:3000/api/tasks/{taskId} -H "X-Api-Key: alice-1234"
```

**Task Statuses:** `to-do` | `in-progress` | `blocked` | `completed`

### Comments

```bash
# List all comments
curl http://localhost:3000/api/comments -H "X-Api-Key: alice-1234"

# List comments for a specific task
curl "http://localhost:3000/api/comments?taskId={taskId}" -H "X-Api-Key: alice-1234"

# Get a specific comment
curl http://localhost:3000/api/comments/{commentId} -H "X-Api-Key: alice-1234"

# Create a comment
curl -X POST http://localhost:3000/api/comments \
  -H "X-Api-Key: alice-1234" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "{taskId}", "content": "My comment", "authorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'

# Update a comment
curl -X PATCH http://localhost:3000/api/comments/{commentId} \
  -H "X-Api-Key: alice-1234" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated comment"}'

# Delete a comment (must be the author - uses authenticated user)
curl -X DELETE http://localhost:3000/api/comments/{commentId} \
  -H "X-Api-Key: alice-1234"
```

---

## Implementation Notes

### Global Configuration

The application is configured in `main.ts` with three key settings:

```typescript
app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({ transform: true }));
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

**`setGlobalPrefix('api')`**
All routes are prefixed with `/api`. This prepares the app for serving a static client later via `ServeStaticModule` - the client will be served at `/` while the API lives under `/api`.

**`ValidationPipe({ transform: true })`**
Enables automatic transformation of incoming data. Query parameters (which are strings by default) get converted to their declared types. For example, `changedSince` in `FindTasksQueryDto` is automatically parsed as a `Date`.

**`ClassSerializerInterceptor`**
Works with `class-transformer` decorators on entities. When returning an entity from a controller, fields marked with `@Exclude()` are automatically removed from the response.

### Authentication

The `ApiKeyGuard` is applied globally via `AuthModule` and protects all endpoints.

```typescript
// api-key.guard.ts
private extractApiKey(request: Request): string | undefined {
  // First try header
  const headerKey = request.headers['x-api-key'];
  if (headerKey) return headerKey;

  // Then try cookie
  const cookieKey = request.cookies?.['apiKey'];
  if (cookieKey) return cookieKey;

  return undefined;
}
```

**Header support (`X-Api-Key`):** Standard approach for API clients and curl testing.

**Cookie support (`apiKey`):** Enables browser-based clients to authenticate. When we add the static client later, it can set the API key as a cookie and all fetch requests will automatically include it.

The guard attaches the authenticated user to the request object, making it available via the `@CurrentUser()` decorator in controllers.

### CORS

No CORS configuration is needed for this application. The client will be served by the same server using `ServeStaticModule`, so all API requests are same-origin. If you were to serve the client from a different origin (e.g., a separate dev server on a different port), you would need to enable CORS:

```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true, // Required for cookie-based authentication
});
```

### Entity Patterns

**`@Exclude()` decorator**
Hides internal fields from API responses. For example, `Task` has an `internalPriority` field and `Comment` has a `sentimentScore` - both are calculated server-side and excluded from responses:

```typescript
// task.entity.ts
@Exclude()
internalPriority?: number;
```

**Soft deletes**
Entities have a `deletedAt` field. When "deleted", the field is set to the current timestamp rather than removing the record. Services filter out deleted items when querying.

**In-memory storage**
For simplicity, all data is stored in arrays within services. Data is seeded on module initialization via `OnModuleInit`. This avoids database setup complexity while teaching the core concepts.

**Constructor pattern**
Entities use a constructor that accepts `Partial<Entity>`:

```typescript
constructor(partial: Partial<Task>) {
  Object.assign(this, partial);
}
```

This pattern allows creating entities with any subset of fields, which is useful for both seeding and updates.
