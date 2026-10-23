import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  static readonly path = '/web/index.php/dashboard/index';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(DashboardPage.path);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard\/index$/);
    await expect(this.pageTitle).toHaveText('Dashboard');
    await expect(this.userMenu).toBeVisible();
  }
}
