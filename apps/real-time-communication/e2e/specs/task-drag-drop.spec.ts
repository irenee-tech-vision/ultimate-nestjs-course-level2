import { test, expect } from '../fixtures/base';
import { BoardPage } from '../pages/board.page';
import { AddTaskModalPage } from '../pages/add-task-modal.page';

test.describe('Task Drag and Drop', () => {
  let boardPage: BoardPage;
  let addTaskModal: AddTaskModalPage;

  test.beforeEach(async ({ page, authenticateAs }) => {
    boardPage = new BoardPage(page);
    addTaskModal = new AddTaskModalPage(page);
    await authenticateAs('alice');
    await boardPage.goto();
    await boardPage.waitForBoardLoad();
  });

  test('should drag task from to-do to in-progress', async () => {
    // Create a task specifically for this test
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Drag Test Task' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Get the task we just created
    const todoTasks = await boardPage.getTasksInColumn('to-do');
    const taskToDrag = todoTasks.find((t) => t.title === 'Drag Test Task');
    expect(taskToDrag).toBeDefined();

    const initialTodoCount = await boardPage.getTaskCount('to-do');
    const initialInProgressCount = await boardPage.getTaskCount('in-progress');

    // Drag task to in-progress column
    await boardPage.dragTaskToColumn(taskToDrag!.id, 'in-progress');

    // Wait for the UI to update
    await boardPage.page.waitForTimeout(500);

    // Verify counts changed
    const newTodoCount = await boardPage.getTaskCount('to-do');
    const newInProgressCount = await boardPage.getTaskCount('in-progress');

    expect(newTodoCount).toBe(initialTodoCount - 1);
    expect(newInProgressCount).toBe(initialInProgressCount + 1);

    // Verify task is in the new column
    const inProgressTasks = await boardPage.getTasksInColumn('in-progress');
    const movedTask = inProgressTasks.find((t) => t.title === 'Drag Test Task');
    expect(movedTask).toBeDefined();
  });

  test('should drag task to blocked column', async () => {
    // Create a task specifically for this test
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Block Test Task' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Get the task we just created
    const todoTasks = await boardPage.getTasksInColumn('to-do');
    const taskToDrag = todoTasks.find((t) => t.title === 'Block Test Task');
    expect(taskToDrag).toBeDefined();

    const initialBlockedCount = await boardPage.getTaskCount('blocked');

    // Drag to blocked
    await boardPage.dragTaskToColumn(taskToDrag!.id, 'blocked');
    await boardPage.page.waitForTimeout(500);

    // Verify task moved to blocked
    const newBlockedCount = await boardPage.getTaskCount('blocked');
    expect(newBlockedCount).toBe(initialBlockedCount + 1);

    const blockedTasks = await boardPage.getTasksInColumn('blocked');
    const movedTask = blockedTasks.find((t) => t.title === 'Block Test Task');
    expect(movedTask).toBeDefined();
  });

  test('should drag task to completed column', async () => {
    const uniqueTitle = `Complete Test Task ${Date.now()}`;

    // Create a task in in-progress specifically for this test
    await boardPage.clickAddTask('in-progress');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: uniqueTitle });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Wait for task to appear
    await boardPage.page.waitForTimeout(500);

    // Get the task we just created
    const inProgressTasks = await boardPage.getTasksInColumn('in-progress');
    const taskToDrag = inProgressTasks.find((t) => t.title === uniqueTitle);
    expect(taskToDrag).toBeDefined();

    const initialCompletedCount = await boardPage.getTaskCount('completed');

    // Drag to completed - use a longer wait and retry approach
    await boardPage.dragTaskToColumn(taskToDrag!.id, 'completed');
    await boardPage.page.waitForTimeout(1000);

    // Verify task moved to completed
    const newCompletedCount = await boardPage.getTaskCount('completed');
    expect(newCompletedCount).toBe(initialCompletedCount + 1);

    const completedTasks = await boardPage.getTasksInColumn('completed');
    const movedTask = completedTasks.find((t) => t.title === uniqueTitle);
    expect(movedTask).toBeDefined();
  });

  test('should persist status after page refresh', async ({ page }) => {
    // Create a task and drag it
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Persist Status Task' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Get the task and drag to in-progress
    const todoTasks = await boardPage.getTasksInColumn('to-do');
    const taskToDrag = todoTasks.find((t) => t.title === 'Persist Status Task');
    expect(taskToDrag).toBeDefined();

    await boardPage.dragTaskToColumn(taskToDrag!.id, 'in-progress');
    await page.waitForTimeout(1000); // Wait for API call

    // Refresh the page
    await page.reload();
    await boardPage.waitForBoardLoad();

    // Verify task is still in in-progress column
    const inProgressTasks = await boardPage.getTasksInColumn('in-progress');
    const movedTask = inProgressTasks.find((t) => t.title === 'Persist Status Task');
    expect(movedTask).toBeDefined();
  });
});
