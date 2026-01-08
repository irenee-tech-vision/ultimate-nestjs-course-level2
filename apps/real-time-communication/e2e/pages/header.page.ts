import { Page, Locator, expect } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly header: Locator;
  readonly userSwitcher: Locator;
  readonly userSelect: Locator;
  readonly userAvatar: Locator;
  readonly userName: Locator;
  readonly pollingBadge: Locator;
  readonly sseBadge: Locator;
  readonly wsBadge: Locator;
  readonly refreshBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('.app-header');
    this.userSwitcher = page.locator('#headerUserSwitcher');
    this.userSelect = page.locator('#headerUserSelect');
    this.userAvatar = page.locator('#headerUserAvatar');
    this.userName = page.locator('#headerUserName');
    this.pollingBadge = page.locator('#pollingBadge');
    this.sseBadge = page.locator('#sseBadge');
    this.wsBadge = page.locator('#wsBadge');
    this.refreshBtn = page.locator('#refreshBtn');
  }

  async getCurrentUserName(): Promise<string> {
    return (await this.userName.textContent()) || '';
  }

  async switchUser(userName: string) {
    await this.userSelect.selectOption({ label: userName });
  }

  async togglePolling() {
    await this.pollingBadge.click();
  }

  async toggleSSE() {
    await this.sseBadge.click();
  }

  async toggleWebSocket() {
    await this.wsBadge.click();
  }

  async setPolling(enabled: boolean) {
    const isActive = await this.isPollingEnabled();
    if (isActive !== enabled) {
      await this.togglePolling();
    }
  }

  async setSSE(enabled: boolean) {
    const isActive = await this.isSSEEnabled();
    if (isActive !== enabled) {
      await this.toggleSSE();
    }
  }

  async setWebSocket(enabled: boolean) {
    const isActive = await this.isWebSocketEnabled();
    if (isActive !== enabled) {
      await this.toggleWebSocket();
    }
  }

  async isPollingEnabled(): Promise<boolean> {
    const classes = await this.pollingBadge.getAttribute('class');
    return classes?.includes('active') ?? false;
  }

  async isSSEEnabled(): Promise<boolean> {
    const classes = await this.sseBadge.getAttribute('class');
    return classes?.includes('active') ?? false;
  }

  async isWebSocketEnabled(): Promise<boolean> {
    const classes = await this.wsBadge.getAttribute('class');
    return classes?.includes('active') ?? false;
  }

  async getBadgeState(badge: 'polling' | 'sse' | 'ws'): Promise<boolean> {
    const badgeLocator =
      badge === 'polling' ? this.pollingBadge : badge === 'sse' ? this.sseBadge : this.wsBadge;
    const classes = await badgeLocator.getAttribute('class');
    return classes?.includes('active') ?? false;
  }

  async clickRefresh() {
    await this.refreshBtn.click();
  }

  async waitForRefreshAnimation() {
    await expect(this.refreshBtn).toHaveClass(/refreshing/);
    await expect(this.refreshBtn).not.toHaveClass(/refreshing/, { timeout: 2000 });
  }
}
