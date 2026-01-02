import { User } from '../../src/users/entities/user.entity';

export const USERS = {
  ALICE: new User({
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Alice',
    apiKey: 'alice-1234',
  }),
  BOB: new User({
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Bob',
    apiKey: 'bob-1234',
  }),
  CHARLIE: new User({
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Charlie',
    apiKey: 'charlie-1234',
  }),
};

export const seedUsers = Object.values(USERS);
