import { test, expect } from '../fixtures/base';
import { BoardPage } from '../pages/board.page';
import { SidePanelPage } from '../pages/side-panel.page';
import { AddTaskModalPage } from '../pages/add-task-modal.page';

test.describe('Comments', () => {
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

  test('should display comments when opening task panel', async () => {
    // Click on a task that has comments (seed data includes comments)
    const tasks = await boardPage.getTasksInColumn('to-do');
    expect(tasks.length).toBeGreaterThan(0);

    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    // Comments section should be visible
    await expect(sidePanel.commentsList).toBeVisible();
    await expect(sidePanel.commentsCount).toBeVisible();
  });

  test('should add a new comment', async () => {
    // Create a task for testing
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Comment Test Task' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    // Open the task
    const tasks = await boardPage.getTasksInColumn('to-do');
    const task = tasks.find((t) => t.title === 'Comment Test Task');
    expect(task).toBeDefined();

    await boardPage.clickTask(task!.id);
    await sidePanel.waitForOpen();

    const initialCount = await sidePanel.getCommentCount();

    // Add a comment
    const commentText = 'This is a test comment';
    await sidePanel.addComment(commentText);

    // Verify comment was added
    const newCount = await sidePanel.getCommentCount();
    expect(newCount).toBe(initialCount + 1);

    const comments = await sidePanel.getComments();
    expect(comments).toContain(commentText);
  });

  test('should show comment count', async () => {
    // Create a task and add comments
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Count Test Task' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    const tasks = await boardPage.getTasksInColumn('to-do');
    const task = tasks.find((t) => t.title === 'Count Test Task');
    await boardPage.clickTask(task!.id);
    await sidePanel.waitForOpen();

    // Initially should have 0 comments
    expect(await sidePanel.getCommentCount()).toBe(0);

    // Add comments
    await sidePanel.addComment('First comment');
    expect(await sidePanel.getCommentCount()).toBe(1);

    await sidePanel.addComment('Second comment');
    expect(await sidePanel.getCommentCount()).toBe(2);
  });

  test('should edit own comment', async () => {
    // Create a task and add a comment
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Edit Comment Test' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    const tasks = await boardPage.getTasksInColumn('to-do');
    const task = tasks.find((t) => t.title === 'Edit Comment Test');
    await boardPage.clickTask(task!.id);
    await sidePanel.waitForOpen();

    // Add a comment
    await sidePanel.addComment('Original comment text');

    // Get the comment and edit it
    const commentItems = await sidePanel.getCommentItems();
    const myComment = commentItems.find(
      (c) => c.content === 'Original comment text',
    );
    expect(myComment).toBeDefined();
    expect(myComment!.isOwn).toBe(true);

    // Edit the comment
    await sidePanel.editComment(myComment!.id, 'Updated comment text');

    // Verify the comment was updated
    const updatedComments = await sidePanel.getComments();
    expect(updatedComments).toContain('Updated comment text');
    expect(updatedComments).not.toContain('Original comment text');
  });

  test('should delete own comment', async () => {
    // Create a task and add a comment
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Delete Comment Test' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    const tasks = await boardPage.getTasksInColumn('to-do');
    const task = tasks.find((t) => t.title === 'Delete Comment Test');
    await boardPage.clickTask(task!.id);
    await sidePanel.waitForOpen();

    // Add a comment
    await sidePanel.addComment('Comment to delete');

    const countBefore = await sidePanel.getCommentCount();
    expect(countBefore).toBe(1);

    // Get the comment and delete it
    const commentItems = await sidePanel.getCommentItems();
    const myComment = commentItems.find((c) => c.content === 'Comment to delete');
    expect(myComment).toBeDefined();

    await sidePanel.deleteComment(myComment!.id);

    // Verify the comment was deleted
    const countAfter = await sidePanel.getCommentCount();
    expect(countAfter).toBe(0);

    const comments = await sidePanel.getComments();
    expect(comments).not.toContain('Comment to delete');
  });

  test('should not show menu for other users comments', async ({ page }) => {
    // Import header page for user switching
    const { HeaderPage } = await import('../pages/header.page');
    const headerPage = new HeaderPage(page);

    // Create a task as Alice and add a comment
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Multi-user Comment Test' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    const tasks = await boardPage.getTasksInColumn('to-do');
    const task = tasks.find((t) => t.title === 'Multi-user Comment Test');
    await boardPage.clickTask(task!.id);
    await sidePanel.waitForOpen();

    // Add a comment as Alice
    await sidePanel.addComment('Comment by Alice');

    // Wait for comment to be visible and verify it was added
    await expect(
      sidePanel.commentsList.locator('.comment-item'),
    ).toHaveCount(1, { timeout: 5000 });

    await sidePanel.close();

    // Switch to Bob using the header user dropdown
    await headerPage.switchUser('Bob');

    // Open the same task as Bob
    const tasksAsBob = await boardPage.getTasksInColumn('to-do');
    const taskAsBob = tasksAsBob.find((t) => t.title === 'Multi-user Comment Test');
    expect(taskAsBob).toBeDefined();
    await boardPage.clickTask(taskAsBob!.id);
    await sidePanel.waitForOpen();

    // Wait for comments to load
    await expect(
      sidePanel.commentsList.locator('.comment-item'),
    ).toHaveCount(1, { timeout: 5000 });

    // Bob should see Alice's comment but not have menu access
    const commentItems = await sidePanel.getCommentItems();
    const aliceComment = commentItems.find((c) => c.content === 'Comment by Alice');
    expect(aliceComment).toBeDefined();
    expect(aliceComment!.isOwn).toBe(false);

    // Verify Bob cannot see the menu
    const hasMenu = await sidePanel.hasCommentMenu(aliceComment!.id);
    expect(hasMenu).toBe(false);
  });

  test('should disable submit button when comment is empty', async () => {
    const tasks = await boardPage.getTasksInColumn('to-do');
    await boardPage.clickTask(tasks[0].id);
    await sidePanel.waitForOpen();

    // Initially submit should be disabled (empty input)
    expect(await sidePanel.isCommentSubmitEnabled()).toBe(false);

    // Type something
    await sidePanel.commentInput.fill('Some text');
    expect(await sidePanel.isCommentSubmitEnabled()).toBe(true);

    // Clear the input
    await sidePanel.commentInput.fill('');
    expect(await sidePanel.isCommentSubmitEnabled()).toBe(false);
  });

  test('should display comment author name', async () => {
    // Create a task and add a comment
    await boardPage.clickAddTask('to-do');
    await addTaskModal.waitForOpen();
    await addTaskModal.fillForm({ title: 'Author Display Test' });
    await addTaskModal.submit();
    await addTaskModal.waitForClose();

    const tasks = await boardPage.getTasksInColumn('to-do');
    const task = tasks.find((t) => t.title === 'Author Display Test');
    await boardPage.clickTask(task!.id);
    await sidePanel.waitForOpen();

    // Add a comment as Alice
    await sidePanel.addComment('Comment with author');

    // Verify author name is shown
    const commentItems = await sidePanel.getCommentItems();
    const myComment = commentItems.find((c) => c.content === 'Comment with author');
    expect(myComment).toBeDefined();
    expect(myComment!.author).toBe('Alice');
  });
});
