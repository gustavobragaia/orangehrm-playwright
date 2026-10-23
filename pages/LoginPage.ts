import { expect, type Locator, type Page } from '@playwright/test';
import { FormField } from './components/FormField';

export class LoginPage {
  static readonly path = '/web/index.php/auth/login';

  readonly username: FormField;
  readonly password: FormField;
  readonly submitButton: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.username = new FormField(page, 'Username');
    this.password = new FormField(page, 'Password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.alert = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto(LoginPage.path);
    await expect(this.submitButton).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.input.fill(username);
    await this.password.input.fill(password);
    await this.submitButton.click();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/login$/);
    await expect(this.submitButton).toBeVisible();
  }

  async expectAlert(message: string): Promise<void> {
    await expect(this.alert).toContainText(message);
  }
}
