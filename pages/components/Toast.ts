import { expect, type Locator, type Page } from '@playwright/test';

/** Notificação flutuante do OrangeHRM (canto inferior esquerdo). */
export class Toast {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.locator('.oxd-toast');
  }

  async expectMessage(message: string): Promise<void> {
    await expect(this.root.filter({ hasText: message }).first()).toBeVisible();
  }
}
