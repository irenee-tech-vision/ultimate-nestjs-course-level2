import { ObjectId } from 'mongodb';
import { User } from '../../src/users/entities/user.entity';

export const USERS = {
  ALICE: new User({
    _id: new ObjectId('69637b74a4f23cc082497f67'),
    name: 'Alice',
    apiKey: 'alice-1234',
  }),
  BOB: new User({
    _id: new ObjectId('69637b8997be6a5125627c31'),
    name: 'Bob',
    apiKey: 'bob-1234',
  }),
  CHARLIE: new User({
    _id: new ObjectId('69637b964936a86a16289e68'),
    name: 'Charlie',
    apiKey: 'charlie-1234',
  }),
};

export const seedUsers = Object.values(USERS);
