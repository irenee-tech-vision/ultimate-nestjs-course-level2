// User API keys matching the backend seed data (from test/fixtures/users.fixture.ts)
export const USERS = {
  alice: {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Alice',
    apiKey: 'alice-1234',
  },
  bob: {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Bob',
    apiKey: 'bob-1234',
  },
  charlie: {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Charlie',
    apiKey: 'charlie-1234',
  },
} as const;

export type UserKey = keyof typeof USERS;