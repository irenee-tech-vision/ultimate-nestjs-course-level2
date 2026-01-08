import { test, expect } from '../fixtures/base';
import { BoardPage } from '../pages/board.page';

test.describe('Board', () => {
  let boardPage: BoardPage;

  test.beforeEach(async ({ page, authenticateAs }) => {
    boardPage = new BoardPage(page);
    await authenticateAs('alice');
    await boardPage.goto();
    await boardPage.waitForBoardLoad();
  });

  test('should load with 4 columns', async ({ page }) => {
    // Verify all 4 columns are present
    await expect(boardPage.columns).toHaveCount(4);

    // Verify column headers using data-testid selectors
    await expect(page.getByTestId('column-title-to-do')).toHaveText('Todo');
    await expect(page.getByTestId('column-title-in-progress')).toHaveText('In Progress');
    await expect(page.getByTestId('column-title-blocked')).toHaveText('Blocked');
    await expect(page.getByTestId('column-title-completed')).toHaveText('Done');
  });

  test('should display tasks in correct columns', async () => {
    // Get task counts from each column
    const todoCount = await boardPage.getTaskCount('to-do');
    const inProgressCount = await boardPage.getTaskCount('in-progress');
    const blockedCount = await boardPage.getTaskCount('blocked');
    const completedCount = await boardPage.getTaskCount('completed');

    // Verify there are tasks in at least some columns (based on seed data)
    expect(todoCount).toBeGreaterThan(0);
    expect(completedCount).toBeGreaterThan(0);

    // Verify total task count matches seed data (21 tasks)
    const totalTasks = todoCount + inProgressCount + blockedCount + completedCount;
    expect(totalTasks).toBe(21);
  });

  test('should show correct task counts in column headers', async () => {
    // Get actual task counts
    const todoCount = await boardPage.getTaskCount('to-do');
    const inProgressCount = await boardPage.getTaskCount('in-progress');
    const blockedCount = await boardPage.getTaskCount('blocked');
    const completedCount = await boardPage.getTaskCount('completed');

    // Verify column count badges match actual counts
    await expect(boardPage.getColumnCount('to-do')).toHaveText(String(todoCount));
    await expect(boardPage.getColumnCount('in-progress')).toHaveText(String(inProgressCount));
    await expect(boardPage.getColumnCount('blocked')).toHaveText(String(blockedCount));
    await expect(boardPage.getColumnCount('completed')).toHaveText(String(completedCount));
  });

  test('should display task cards with title and date', async () => {
    // Get first task in to-do column
    const todoTasks = await boardPage.getTasksInColumn('to-do');
    expect(todoTasks.length).toBeGreaterThan(0);

    const firstTaskId = todoTasks[0].id;
    const taskCard = boardPage.getTaskCard(firstTaskId);

    // Verify task card has title and date
    await expect(taskCard.locator('.task-title')).toBeVisible();
    await expect(taskCard.locator('.task-date')).toBeVisible();
  });

  test('should have add task button in each column', async () => {
    // Verify each column has an add task button
    await expect(boardPage.getAddTaskButton('to-do')).toBeVisible();
    await expect(boardPage.getAddTaskButton('in-progress')).toBeVisible();
    await expect(boardPage.getAddTaskButton('blocked')).toBeVisible();
    await expect(boardPage.getAddTaskButton('completed')).toBeVisible();
  });

  test('should show service status badges in header', async ({ page }) => {
    // Verify service badges are visible
    await expect(page.locator('#pollingBadge')).toBeVisible();
    await expect(page.locator('#sseBadge')).toBeVisible();
    await expect(page.locator('#wsBadge')).toBeVisible();
  });
});
