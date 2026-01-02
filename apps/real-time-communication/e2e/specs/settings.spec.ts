import { test, expect } from '../fixtures/base';
import { BoardPage } from '../pages/board.page';
import { HeaderPage } from '../pages/header.page';

test.describe('Header Controls', () => {
  let boardPage: BoardPage;
  let headerPage: HeaderPage;

  test.beforeEach(async ({ page, authenticateAs }) => {
    boardPage = new BoardPage(page);
    headerPage = new HeaderPage(page);
    await authenticateAs('alice');
    await boardPage.goto();
    await boardPage.waitForBoardLoad();
  });

  test('should display current user in header', async () => {
    const userName = await headerPage.getCurrentUserName();
    expect(userName).toBe('Alice');
  });

  test('should display all three users in dropdown', async () => {
    // Get all options from the user select
    const options = await headerPage.userSelect.locator('option').allTextContents();

    expect(options).toContain('Alice');
    expect(options).toContain('Bob');
    expect(options).toContain('Charlie');
  });

  test('should switch between users', async () => {
    // Get initial user
    const initialUser = await headerPage.getCurrentUserName();
    expect(initialUser).toBe('Alice');

    // Switch to Bob
    await headerPage.switchUser('Bob');

    // Verify user changed
    const newUser = await headerPage.getCurrentUserName();
    expect(newUser).toBe('Bob');
  });

  test('should toggle polling service', async () => {
    // Get initial state
    const initialState = await headerPage.isPollingEnabled();

    // Toggle polling
    await headerPage.setPolling(!initialState);

    // Verify state changed
    const newState = await headerPage.isPollingEnabled();
    expect(newState).toBe(!initialState);
  });

  test('should toggle SSE service', async () => {
    // Get initial state
    const initialState = await headerPage.isSSEEnabled();

    // Toggle SSE
    await headerPage.setSSE(!initialState);

    // Verify state changed
    const newState = await headerPage.isSSEEnabled();
    expect(newState).toBe(!initialState);
  });

  test('should toggle WebSocket service', async () => {
    // Get initial state
    const initialState = await headerPage.isWebSocketEnabled();

    // Toggle WebSocket
    await headerPage.setWebSocket(!initialState);

    // Verify state changed
    const newState = await headerPage.isWebSocketEnabled();
    expect(newState).toBe(!initialState);
  });

  test('should have manual refresh button in header', async () => {
    await expect(headerPage.refreshBtn).toBeVisible();
  });

  test('should update badge states when toggling services', async ({ page }) => {
    // Turn off polling and verify badge updates
    await headerPage.setPolling(false);
    await page.waitForTimeout(100); // Wait for UI update

    // Badge should not have 'active' class when disabled
    const pollingBadgeClasses = await headerPage.pollingBadge.getAttribute('class');
    expect(pollingBadgeClasses).not.toContain('active');

    // Turn on polling and verify badge updates
    await headerPage.setPolling(true);
    await page.waitForTimeout(100);

    const pollingBadgeClassesOn = await headerPage.pollingBadge.getAttribute('class');
    expect(pollingBadgeClassesOn).toContain('active');
  });

  test('should show tooltips on service badges', async () => {
    // Check polling badge tooltip
    const pollingTitle = await headerPage.pollingBadge.getAttribute('title');
    expect(pollingTitle).toContain('Polling');
    expect(pollingTitle).toContain('click to toggle');

    // Check SSE badge tooltip
    const sseTitle = await headerPage.sseBadge.getAttribute('title');
    expect(sseTitle).toContain('SSE');
    expect(sseTitle).toContain('click to toggle');

    // Check WebSocket badge tooltip
    const wsTitle = await headerPage.wsBadge.getAttribute('title');
    expect(wsTitle).toContain('WebSocket');
    expect(wsTitle).toContain('click to toggle');
  });

  test('should animate refresh button when clicked', async ({ page }) => {
    // Click refresh
    await headerPage.clickRefresh();

    // Wait for animation to start
    await expect(headerPage.refreshBtn).toHaveClass(/refreshing/);

    // Wait for animation to complete
    await expect(headerPage.refreshBtn).not.toHaveClass(/refreshing/, { timeout: 2000 });
  });
});
