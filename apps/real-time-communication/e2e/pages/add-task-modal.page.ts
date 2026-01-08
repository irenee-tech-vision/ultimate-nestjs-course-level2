import { Page, Locator, expect } from '@playwright/test';

export class AddTaskModalPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly assigneeSelect: Locator;
  readonly submitBtn: Locator;
  readonly cancelBtn: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#addModal');
    this.titleInput = page.locator('#addTitle');
    this.descriptionInput = page.locator('#addDescription');
    this.assigneeSelect = page.locator('#addAssignee');
    this.submitBtn = this.modal.locator('button[type="submit"]');
    this.cancelBtn = this.modal.locator('button:has-text("Cancel")');
    this.form = page.locator('#addTaskForm');
  }

  async isVisible(): Promise<boolean> {
    const display = await this.modal.evaluate((el) => window.getComputedStyle(el).display);
    return display !== 'none';
  }

  async waitForOpen() {
    await expect(this.modal).toHaveCSS('display', 'flex', { timeout: 5000 });
  }

  async waitForClose() {
    await expect(this.modal).toHaveCSS('display', 'none', { timeout: 5000 });
  }

  async fillForm(data: { title: string; description?: string; assignee?: string }) {
    await this.titleInput.fill(data.title);
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.assignee) {
      await this.assigneeSelect.selectOption({ label: data.assignee });
    }
  }

  async submit() {
    await this.submitBtn.click();
  }

  async cancel() {
    await this.cancelBtn.click();
    await this.waitForClose();
  }

  async getTitle(): Promise<string> {
    return this.titleInput.inputValue();
  }

  async getDescription(): Promise<string> {
    return this.descriptionInput.inputValue();
  }
}
