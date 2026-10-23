import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Um grupo "label + controle + mensagem de erro" do design system do OrangeHRM.
 * Os inputs não têm id/name estáveis, então o campo é localizado pelo texto do label.
 */
export class FormField {
  readonly group: Locator;
  readonly error: Locator;

  constructor(scope: Page | Locator, label: string) {
    // O locator interno do `has` é avaliado relativo ao grupo, por isso parte da Page.
    const page = 'page' in scope && typeof scope.page === 'function' ? scope.page() : (scope as Page);
    this.group = scope
      .locator('.oxd-input-group')
      .filter({ has: page.locator('label', { hasText: new RegExp(`^${label}$`) }) });
    this.error = this.group.locator('.oxd-input-field-error-message');
  }

  get input(): Locator {
    return this.group.locator('input, textarea').first();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.error).toHaveText(message);
  }

  async expectNoError(): Promise<void> {
    await expect(this.error).toHaveCount(0);
  }
}

/** Select customizado (div com role=listbox), não é um <select> nativo. */
export class SelectField extends FormField {
  private readonly page: Page;

  constructor(page: Page, scope: Page | Locator, label: string) {
    super(scope, label);
    this.page = page;
  }

  get trigger(): Locator {
    return this.group.locator('.oxd-select-text-input');
  }

  async choose(option: string): Promise<void> {
    await this.trigger.click();
    await this.page.getByRole('listbox').getByRole('option', { name: option, exact: true }).click();
    await expect(this.trigger).toHaveText(option);
  }

  async expectValue(value: string): Promise<void> {
    await expect(this.trigger).toHaveText(value);
  }
}

/** Autocomplete de funcionário: digita, espera as sugestões e escolhe uma. */
export class AutocompleteField extends FormField {
  private readonly page: Page;

  constructor(page: Page, scope: Page | Locator, label: string) {
    super(scope, label);
    this.page = page;
  }

  async choose(fullName: string): Promise<void> {
    await this.input.fill(fullName);
    const option = this.page.getByRole('listbox').getByRole('option', { name: fullName });
    await option.first().click();
    await expect(this.input).toHaveValue(nameMatcher(fullName));
  }
}

/** O OrangeHRM junta first + middle + last e deixa espaço duplo quando não há middle name. */
export function nameMatcher(fullName: string): RegExp {
  const escaped = fullName.split(/\s+/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${escaped.join('\\s+')}$`);
}
