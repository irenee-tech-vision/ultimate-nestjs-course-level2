import { Page, Locator, expect } from '@playwright/test';

export class SidePanelPage {
  readonly page: Page;
  readonly panel: Locator;
  readonly closeBtn: Locator;
  readonly taskIdInput: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly assigneeSelect: Locator;
  readonly assigneeName: Locator;
  readonly saveBtn: Locator;
  readonly deleteBtn: Locator;
  readonly commentsList: Locator;
  readonly commentsCount: Locator;
  readonly commentInput: Locator;
  readonly commentSubmitBtn: Locator;
  readonly typingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('#sidePanel');
    this.closeBtn = this.panel.locator('.panel-close');
    this.taskIdInput = page.locator('#panelTaskId');
    this.titleInput = page.locator('#panelTitle');
    this.descriptionInput = page.locator('#panelDescription');
    this.assigneeSelect = page.locator('#panelAssignee');
    this.assigneeName = page.locator('#panelAssigneeName');
    this.saveBtn = page.locator('#saveBtn');
    this.deleteBtn = this.panel.locator('.btn-danger');
    this.commentsList = page.locator('#commentsList');
    this.commentsCount = page.locator('#commentsCount');
    this.commentInput = page.locator('#commentInput');
    this.commentSubmitBtn = page.locator('#commentSubmit');
    this.typingIndicator = page.locator('#typingIndicator');
  }

  async isOpen(): Promise<boolean> {
    const classes = await this.panel.getAttribute('class');
    return classes?.includes('open') ?? false;
  }

  async waitForOpen() {
    await expect(this.panel).toHaveClass(/open/, { timeout: 5000 });
  }

  async waitForClose() {
    await expect(this.panel).not.toHaveClass(/open/, { timeout: 5000 });
  }

  async close() {
    await this.closeBtn.click();
    await this.waitForClose();
  }

  async getTaskId(): Promise<string> {
    return (await this.taskIdInput.inputValue()) || '';
  }

  async getTitle(): Promise<string> {
    return this.titleInput.inputValue();
  }

  async getDescription(): Promise<string> {
    return this.descriptionInput.inputValue();
  }

  async setTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async setDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async setAssignee(assigneeName: string | null) {
    if (assigneeName === null) {
      await this.assigneeSelect.selectOption({ label: 'Unassigned' });
    } else {
      await this.assigneeSelect.selectOption({ label: assigneeName });
    }
  }

  async getAssigneeName(): Promise<string> {
    return (await this.assigneeName.textContent()) || '';
  }

  async isSaveEnabled(): Promise<boolean> {
    const disabled = await this.saveBtn.getAttribute('disabled');
    return disabled === null;
  }

  async saveChanges() {
    await this.saveBtn.click();
    // Wait for save to complete (button becomes disabled again)
    await expect(this.saveBtn).toBeDisabled({ timeout: 5000 });
  }

  async deleteTask() {
    // Set up dialog handler before clicking delete
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deleteBtn.click();
    await this.waitForClose();
  }

  async getCommentCount(): Promise<number> {
    const text = await this.commentsCount.textContent();
    return parseInt(text || '0', 10);
  }

  async getComments(): Promise<string[]> {
    const comments = this.commentsList.locator('.comment-content');
    const count = await comments.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await comments.nth(i).textContent();
      if (text) texts.push(text);
    }
    return texts;
  }

  async addComment(content: string) {
    await this.commentInput.fill(content);
    await this.commentSubmitBtn.click();
    // Wait for comment to be added
    await this.page.waitForTimeout(500);
  }

  async isCommentSubmitEnabled(): Promise<boolean> {
    const disabled = await this.commentSubmitBtn.getAttribute('disabled');
    return disabled === null;
  }

  async getCommentItems(): Promise<
    { id: string; content: string; author: string; isOwn: boolean }[]
  > {
    const comments = this.commentsList.locator('.comment-item');
    const count = await comments.count();
    const items: { id: string; content: string; author: string; isOwn: boolean }[] = [];

    for (let i = 0; i < count; i++) {
      const comment = comments.nth(i);
      const id = (await comment.getAttribute('data-comment-id')) || '';
      const content =
        (await comment.locator('.comment-content').textContent()) || '';
      const author =
        (await comment.locator('.comment-author').textContent()) || '';
      // Own comments have a menu button without 'hidden' class
      const menuBtn = comment.locator('.comment-menu-btn:not(.hidden)');
      const isOwn = (await menuBtn.count()) > 0;

      items.push({ id, content, author, isOwn });
    }

    return items;
  }

  async openCommentMenu(commentId: string) {
    const comment = this.commentsList.locator(
      `.comment-item[data-comment-id="${commentId}"]`,
    );
    await comment.locator('.comment-menu-btn').click();
  }

  async editComment(commentId: string, newContent: string) {
    await this.openCommentMenu(commentId);
    const comment = this.commentsList.locator(
      `.comment-item[data-comment-id="${commentId}"]`,
    );
    await comment.locator('.comment-menu-item >> text=Edit').click();

    // Fill in the edit input
    const editInput = this.page.locator(`#comment-edit-input-${commentId}`);
    await editInput.fill(newContent);

    // Click save
    const editContainer = this.page.locator(`#comment-edit-${commentId}`);
    await editContainer.locator('.btn-primary').click();

    await this.page.waitForTimeout(500);
  }

  async deleteComment(commentId: string) {
    await this.openCommentMenu(commentId);
    const comment = this.commentsList.locator(
      `.comment-item[data-comment-id="${commentId}"]`,
    );

    // Set up dialog handler before clicking delete
    this.page.once('dialog', (dialog) => dialog.accept());
    await comment.locator('.comment-menu-item.danger').click();

    await this.page.waitForTimeout(500);
  }

  async hasCommentMenu(commentId: string): Promise<boolean> {
    const comment = this.commentsList.locator(
      `.comment-item[data-comment-id="${commentId}"]`,
    );
    const menuBtn = comment.locator('.comment-menu-btn:not(.hidden)');
    return (await menuBtn.count()) > 0;
  }
}
