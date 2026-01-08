import { test as base } from '@playwright/test';
import { UserKey, USERS } from './users.data';

// Extended test fixture with authentication helpers
export const test = base.extend<{
  authenticateAs: (user: UserKey) => Promise<void>;
}>({
  authenticateAs: async ({ context }, use) => {
    const authenticateAs = async (user: UserKey) => {
      await context.addCookies([
        {
          name: 'apiKey',
          value: USERS[user].apiKey,
          domain: 'localhost',
          path: '/',
        },
      ]);
    };
    await use(authenticateAs);
  },
});

export { expect } from '@playwright/test';
