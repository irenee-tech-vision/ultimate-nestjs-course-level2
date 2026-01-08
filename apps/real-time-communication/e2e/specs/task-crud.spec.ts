import { test, expect } from '../fixtures/base';
import { BoardPage } from '../pages/board.page';
import { AddTaskModalPage } from '../pages/add-task-modal.page';
import { SidePanelPage } from '../pages/side-panel.page';

test.describe('Task Creation', () => {
  let boardPage: BoardPage;
  let addTaskModal: AddTaskModalPage;

  test.beforeEach(async ({ page, authenticateAs }) => {
    boardPage = new BoardPage(page);
    addTaskModal = new AddTaskModalPage(page);
    await authenticateAs('alice');
    await boardPage.goto();
    await boardPage.waitForBoardLoad();
  });

  test('should open add task modal when clicking add button', async () => {
    // Click add task in to-do column
    await boardPage.clickAddTask('to-do');

    // Modal should be visible
    await addTaskModal.waitForOpen();
    expect(await addTaskModal.isVisible()).toBe(true);
  });

  test('should close modal when clicking cancel', async () => {
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();

    await addTaskModal.cancel();
    expect(await addTaskModal.isVisible()).toBe(false);
  });

  test('should create a new task', async () => {
    const initialCount = await boardPage.getTaskCount('to-do');

    // Open modal and fill form
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();

    await addTaskModal.fillForm({
      title: 'E2E Test Task',
      description: 'Created by Playwright',
    });

    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Verify task count increased
    const newCount = await boardPage.getTaskCount('to-do');
    expect(newCount).toBe(initialCount + 1);

    // Verify task appears on board
    const tasks = await boardPage.getTasksInColumn('to-do');
    const newTask = tasks.find((t) => t.title === 'E2E Test Task');
    expect(newTask).toBeDefined();
  });

  test('should create task with assignee', async () => {
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();

    await addTaskModal.fillForm({
      title: 'Task with Assignee',
      assignee: 'Bob',
    });

    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Verify task appears
    const tasks = await boardPage.getTasksInColumn('to-do');
    const newTask = tasks.find((t) => t.title === 'Task with Assignee');
    expect(newTask).toBeDefined();
  });

  test('should require title field', async ({ page }) => {
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();

    // Try to submit without title (HTML5 validation should prevent)
    const titleRequired = await addTaskModal.titleInput.getAttribute('required');
    expect(titleRequired).not.toBeNull();

    // Fill only description
    await addTaskModal.fillForm({
      title: '', // Empty title
      description: 'No title provided',
    });

    // The form should not submit due to HTML5 validation
    // We can verify the form is still open after attempting submit
    await addTaskModal.submit();

    // Modal should still be open because validation failed
    expect(await addTaskModal.isVisible()).toBe(true);
  });

  test('should create task in different columns', async () => {
    // Create task in "In Progress" column
    const initialCount = await boardPage.getTaskCount('in-progress');

    await boardPage.clickAddTask('in-progress');
    await addTaskModal.waitForOpen();

    await addTaskModal.fillForm({
      title: 'In Progress Task',
    });

    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    const newCount = await boardPage.getTaskCount('in-progress');
    expect(newCount).toBe(initialCount + 1);
  });

  test('should clear form after successful submission', async () => {
    // Create first task
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'First Task' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Open modal again - form should be cleared
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();

    const title = await addTaskModal.getTitle();
    const description = await addTaskModal.getDescription();

    expect(title).toBe('');
    expect(description).toBe('');
  });
});

test.describe('Task Edit', () => {
  let boardPage: BoardPage;
  let sidePanel: SidePanelPage;

  test.beforeEach(async ({ page, authenticateAs }) => {
    boardPage = new BoardPage(page);
    sidePanel = new SidePanelPage(page);
    await authenticateAs('alice');
    await boardPage.goto();
    await boardPage.waitForBoardLoad();
  });

  test('should open side panel when clicking a task', async () => {
    const tasks = await boardPage.getTasksInColumn('to-do');
    expect(tasks.length).toBeGreaterThan(0);

    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    expect(await sidePanel.isOpen()).toBe(true);
  });

  test('should close side panel when clicking close button', async () => {
    const tasks = await boardPage.getTasksInColumn('to-do');
    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    await sidePanel.close();
    expect(await sidePanel.isOpen()).toBe(false);
  });

  test('should display task details in side panel', async () => {
    const tasks = await boardPage.getTasksInColumn('to-do');
    const firstTask = tasks[0];

    await boardPage.clickTask(firstTask.id);
    await sidePanel.waitForOpen();

    const title = await sidePanel.getTitle();
    expect(title).toBe(firstTask.title);
  });

  test('should enable save button when title changes', async () => {
    const tasks = await boardPage.getTasksInColumn('to-do');
    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    // Save button should be disabled initially
    expect(await sidePanel.isSaveEnabled()).toBe(false);

    // Change title
    await sidePanel.setTitle('Updated Title');

    // Save button should be enabled
    expect(await sidePanel.isSaveEnabled()).toBe(true);
  });

  test('should save changes to task', async () => {
    const tasks = await boardPage.getTasksInColumn('to-do');
    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    const newTitle = 'Updated Task Title ' + Date.now();
    await sidePanel.setTitle(newTitle);
    await sidePanel.saveChanges();

    // Close and reopen to verify persistence
    await sidePanel.close();
    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    const savedTitle = await sidePanel.getTitle();
    expect(savedTitle).toBe(newTitle);
  });

  test('should change task assignee', async () => {
    const tasks = await boardPage.getTasksInColumn('to-do');
    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    // Change assignee to Bob
    await sidePanel.setAssignee('Bob');

    // Wait for the change to take effect
    await sidePanel.page.waitForTimeout(500);

    // Verify assignee changed
    const assigneeName = await sidePanel.getAssigneeName();
    expect(assigneeName).toBe('Bob');
  });
});

test.describe('Task Delete', () => {
  let boardPage: BoardPage;
  let sidePanel: SidePanelPage;
  let addTaskModal: AddTaskModalPage;

  test.beforeEach(async ({ page, authenticateAs }) => {
    boardPage = new BoardPage(page);
    sidePanel = new SidePanelPage(page);
    addTaskModal = new AddTaskModalPage(page);
    await authenticateAs('alice');
    await boardPage.goto();
    await boardPage.waitForBoardLoad();
  });

  test('should delete a task', async () => {
    // Create a task to delete
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Task to Delete' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Find and click the new task
    const tasks = await boardPage.getTasksInColumn('to-do');
    const taskToDelete = tasks.find((t) => t.title === 'Task to Delete');
    expect(taskToDelete).toBeDefined();

    const initialCount = await boardPage.getTaskCount('to-do');

    await boardPage.clickTask(taskToDelete!.id);
    await sidePanel.waitForOpen();

    // Delete the task
    await sidePanel.deleteTask();

    // Verify task count decreased
    const newCount = await boardPage.getTaskCount('to-do');
    expect(newCount).toBe(initialCount - 1);

    // Verify task no longer exists
    const remainingTasks = await boardPage.getTasksInColumn('to-do');
    const deletedTask = remainingTasks.find((t) => t.title === 'Task to Delete');
    expect(deletedTask).toBeUndefined();
  });
});
