import { test, expect } from '../fixtures/base';
import { BoardPage } from '../pages/board.page';
import { HeaderPage } from '../pages/header.page';
import { ApiHelper } from '../helpers/api.helper';

// Polling tests must run serially to avoid state interference
test.describe.configure({ mode: 'serial' });

test.describe('Polling', () => {
  let boardPage: BoardPage;
  let headerPage: HeaderPage;
  let api: ApiHelper;

  test.beforeEach(async ({ page, request, authenticateAs }) => {
    boardPage = new BoardPage(page);
    headerPage = new HeaderPage(page);
    api = new ApiHelper(request);

    await authenticateAs('alice');
    await boardPage.goto();
    await boardPage.waitForBoardLoad();
  });

  test('should enable and disable polling', async ({ page }) => {
    // Initially polling should be disabled
    expect(await headerPage.isPollingEnabled()).toBe(false);

    // Enable polling
    await headerPage.setPolling(true);
    expect(await headerPage.isPollingEnabled()).toBe(true);

    // Verify badge is active
    const badge = page.locator('#pollingBadge');
    await expect(badge).toHaveClass(/active/);

    // Disable polling
    await headerPage.setPolling(false);
    expect(await headerPage.isPollingEnabled()).toBe(false);

    // Verify badge is inactive
    await expect(badge).not.toHaveClass(/active/);
  });

  test('should show task created via API when polling is enabled', async ({
    page,
  }) => {
    // Enable polling first
    await headerPage.setPolling(true);

    // Verify the task doesn't exist yet
    const uniqueTitle = `API Created Task ${Date.now()}`;
    let tasks = await boardPage.getTasksInColumn('to-do');
    expect(tasks.find((t) => t.title === uniqueTitle)).toBeUndefined();

    // Create a task via API (simulating another user)
    await api.createTask({ title: uniqueTitle, status: 'to-do' });

    // Wait for polling to pick up the change (polling interval is 1 second)
    await page.waitForTimeout(2500);

    // Verify the task is visible
    tasks = await boardPage.getTasksInColumn('to-do');
    const createdTask = tasks.find((t) => t.title === uniqueTitle);
    expect(createdTask).toBeDefined();
  });

  test('should remove task deleted via API when polling is enabled', async ({
    page,
  }) => {
    // Enable polling first
    await headerPage.setPolling(true);

    // Create a task via API
    const uniqueTitle = `Task to Delete ${Date.now()}`;
    const createdTask = await api.createTask({
      title: uniqueTitle,
      status: 'to-do',
    });

    // Wait for the task to appear via polling
    await page.waitForTimeout(2500);

    // Verify the task exists
    let tasks = await boardPage.getTasksInColumn('to-do');
    let foundTask = tasks.find((t) => t.title === uniqueTitle);
    expect(foundTask).toBeDefined();

    // Delete the task via API
    await api.deleteTask(createdTask.id);

    // Wait for polling to pick up the change
    await page.waitForTimeout(2500);

    // Verify the task is removed
    tasks = await boardPage.getTasksInColumn('to-do');
    foundTask = tasks.find((t) => t.title === uniqueTitle);
    expect(foundTask).toBeUndefined();
  });

  test('should update task status when changed via API', async ({ page }) => {
    // Enable polling first
    await headerPage.setPolling(true);

    // Create a task via API
    const uniqueTitle = `Status Update Task ${Date.now()}`;
    const createdTask = await api.createTask({
      title: uniqueTitle,
      status: 'to-do',
    });

    // Wait for task to appear in to-do column using a more robust wait
    await expect(async () => {
      const tasks = await boardPage.getTasksInColumn('to-do');
      expect(tasks.find((t) => t.title === uniqueTitle)).toBeDefined();
    }).toPass({ timeout: 5000 });

    // Update task status via API
    await api.updateTask(createdTask.id, { status: 'in-progress' });

    // Wait for task to appear in in-progress column and disappear from to-do column
    await expect(async () => {
      const inProgressTasks = await boardPage.getTasksInColumn('in-progress');
      expect(inProgressTasks.find((t) => t.title === uniqueTitle)).toBeDefined();

      const todoTasks = await boardPage.getTasksInColumn('to-do');
      expect(todoTasks.find((t) => t.title === uniqueTitle)).toBeUndefined();
    }).toPass({ timeout: 5000 });
  });

  test('should not update board when polling is disabled', async ({ page }) => {
    // Make sure polling is disabled
    await headerPage.setPolling(false);

    // Create a task via API
    const uniqueTitle = `No Polling Task ${Date.now()}`;
    await api.createTask({ title: uniqueTitle, status: 'to-do' });

    // Wait some time (longer than polling interval)
    await page.waitForTimeout(3000);

    // Verify the task is NOT visible (because polling is off)
    const tasks = await boardPage.getTasksInColumn('to-do');
    const createdTask = tasks.find((t) => t.title === uniqueTitle);
    expect(createdTask).toBeUndefined();
  });

  test('should update board when manually refreshing', async ({ page }) => {
    // Make sure polling is disabled
    await headerPage.setPolling(false);

    // Create a task via API
    const uniqueTitle = `Manual Refresh Task ${Date.now()}`;
    await api.createTask({ title: uniqueTitle, status: 'to-do' });

    // Task should not be visible yet (polling off, no refresh)
    let tasks = await boardPage.getTasksInColumn('to-do');
    expect(tasks.find((t) => t.title === uniqueTitle)).toBeUndefined();

    // Click manual refresh in header
    await headerPage.clickRefresh();

    // Wait a moment for the refresh to complete
    await page.waitForTimeout(500);

    // Verify the task now appears
    tasks = await boardPage.getTasksInColumn('to-do');
    const createdTask = tasks.find((t) => t.title === uniqueTitle);
    expect(createdTask).toBeDefined();
  });
});
