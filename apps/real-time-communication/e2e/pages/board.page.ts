import { Page, Locator } from '@playwright/test';

export type TaskStatus = 'to-do' | 'in-progress' | 'blocked' | 'completed';

export interface TaskCardInfo {
  id: string;
  title: string;
}

export class BoardPage {
  readonly page: Page;
  readonly board: Locator;
  readonly columns: Locator;
  readonly loading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.board = page.locator('#board');
    this.columns = page.locator('.column');
    this.loading = page.locator('.loading');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForBoardLoad() {
    // Wait for columns to appear (indicates successful load)
    await this.columns.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  getColumn(status: TaskStatus) {
    return this.page.getByTestId(`column-${status}`);
  }

  getColumnHeader(status: TaskStatus) {
    return this.page.getByTestId(`column-header-${status}`);
  }

  getColumnCount(status: TaskStatus) {
    return this.page.getByTestId(`column-count-${status}`);
  }

  getTasksContainer(status: TaskStatus) {
    return this.page.getByTestId(`tasks-container-${status}`);
  }

  getTaskCards(status: TaskStatus) {
    return this.getColumn(status).locator('.task-card');
  }

  getTaskCard(taskId: string) {
    return this.page.locator(`.task-card[data-id="${taskId}"]`);
  }

  getAddTaskButton(status: TaskStatus) {
    return this.page.getByTestId(`add-task-btn-${status}`);
  }

  async getTaskCount(status: TaskStatus): Promise<number> {
    return this.getTaskCards(status).count();
  }

  async getTasksInColumn(status: TaskStatus): Promise<TaskCardInfo[]> {
    const cards = this.getTaskCards(status);
    const count = await cards.count();
    const tasks: TaskCardInfo[] = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const id = await card.getAttribute('data-id');
      const title = await card.locator('.task-title').textContent();
      if (id && title) {
        tasks.push({ id, title });
      }
    }

    return tasks;
  }

  async clickTask(taskId: string) {
    await this.getTaskCard(taskId).click();
  }

  async clickAddTask(status: TaskStatus) {
    await this.getAddTaskButton(status).click();
  }

  async dragTaskToColumn(taskId: string, targetStatus: TaskStatus) {
    // Use evaluate to dispatch proper HTML5 drag events with dataTransfer
    await this.page.evaluate(
      ({ taskId, targetStatus }) => {
        const card = document.querySelector(
          `.task-card[data-id="${taskId}"]`,
        ) as HTMLElement;
        const container = document.querySelector(
          `.column[data-status="${targetStatus}"] .tasks-container`,
        ) as HTMLElement;

        if (!card || !container) {
          throw new Error(`Could not find card or container`);
        }

        // Create and dispatch dragstart
        const dragStartEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer(),
        });
        dragStartEvent.dataTransfer!.setData('text/plain', taskId);
        card.dispatchEvent(dragStartEvent);

        // Create and dispatch dragover (required for drop to work)
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragStartEvent.dataTransfer,
        });
        container.dispatchEvent(dragOverEvent);

        // Create and dispatch drop
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragStartEvent.dataTransfer,
        });
        container.dispatchEvent(dropEvent);

        // Create and dispatch dragend
        const dragEndEvent = new DragEvent('dragend', {
          bubbles: true,
          cancelable: true,
        });
        card.dispatchEvent(dragEndEvent);
      },
      { taskId, targetStatus },
    );

    // Wait for API call to complete
    await this.page.waitForTimeout(500);
  }

  async getTotalTaskCount(): Promise<number> {
    const statuses: TaskStatus[] = ['to-do', 'in-progress', 'blocked', 'completed'];
    let total = 0;
    for (const status of statuses) {
      total += await this.getTaskCount(status);
    }
    return total;
  }
}
