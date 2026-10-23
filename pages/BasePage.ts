import { expect, type Locator, type Page } from '@playwright/test';
import { Toast } from './components/Toast';

export abstract class BasePage {
  readonly toast: Toast;
  readonly pageTitle: Locator;
  readonly userMenu: Locator;

  constructor(protected readonly page: Page) {
    this.toast = new Toast(page);
    this.pageTitle = page.locator('.oxd-topbar-header-breadcrumb h6').first();
    this.userMenu = page.locator('.oxd-userdropdown-tab');
  }

  /** Espera o spinner de carregamento sumir (as listagens são carregadas via XHR). */
  async waitForLoad(): Promise<void> {
    await expect(this.page.locator('.oxd-loading-spinner')).toHaveCount(0);
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }
}
