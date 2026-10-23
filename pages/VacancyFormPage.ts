import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { AutocompleteField, FormField, SelectField, nameMatcher } from './components/FormField';
import type { VacancyData } from '../data/vacancy.factory';

/** Formulário de vaga — o mesmo componente atende "Add Vacancy" e "Edit Vacancy". */
export class VacancyFormPage extends BasePage {
  static readonly addPath = '/web/index.php/recruitment/addJobVacancy';

  readonly form: Locator;
  readonly heading: Locator;
  readonly name: FormField;
  readonly jobTitle: SelectField;
  readonly description: FormField;
  readonly hiringManager: AutocompleteField;
  readonly numOfPositions: FormField;
  readonly activeSwitch: Locator;
  readonly publishedSwitch: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    // A tela de edição tem um segundo formulário (Attachments); o da vaga é o primeiro.
    this.form = page.locator('form').first();
    this.heading = page.locator('.orangehrm-card-container h6').first();
    this.name = new FormField(this.form, 'Vacancy Name');
    this.jobTitle = new SelectField(page, this.form, 'Job Title');
    this.description = new FormField(this.form, 'Description');
    this.hiringManager = new AutocompleteField(page, this.form, 'Hiring Manager');
    this.numOfPositions = new FormField(this.form, 'Number of Positions');
    this.activeSwitch = this.switchByLabel('Active');
    this.publishedSwitch = this.switchByLabel('Publish in RSS Feed and Web Page');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
  }

  private switchByLabel(label: string): Locator {
    return this.form
      .locator('.orangerhrm-switch-wrapper')
      .filter({ has: this.page.locator('p', { hasText: new RegExp(`^${label}$`) }) })
      .locator('input[type="checkbox"]');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto(VacancyFormPage.addPath);
    await this.expectHeading('Add Vacancy');
  }

  async gotoEdit(id: number): Promise<void> {
    await this.page.goto(`${VacancyFormPage.addPath}/${id}`);
    await this.expectHeading('Edit Vacancy');
    // Os campos são preenchidos depois de uma chamada XHR.
    await expect(this.name.input).not.toHaveValue('');
  }

  async expectHeading(text: 'Add Vacancy' | 'Edit Vacancy'): Promise<void> {
    await expect(this.heading).toHaveText(text);
  }

  async setSwitch(sw: Locator, on: boolean): Promise<void> {
    if ((await sw.isChecked()) !== on) {
      // O <input> fica escondido atrás do <span> estilizado.
      await sw.locator('xpath=following-sibling::span').click();
    }
    await expect(sw).toBeChecked({ checked: on });
  }

  /** Preenche só os campos informados, deixando os demais como estão. */
  async fill(data: Partial<VacancyData>): Promise<void> {
    if (data.name !== undefined) await this.name.input.fill(data.name);
    if (data.jobTitle !== undefined) await this.jobTitle.choose(data.jobTitle);
    if (data.description !== undefined) await this.description.input.fill(data.description);
    if (data.hiringManager !== undefined) await this.hiringManager.choose(data.hiringManager);
    if (data.numOfPositions !== undefined) {
      await this.numOfPositions.input.fill(String(data.numOfPositions));
    }
    if (data.active !== undefined) await this.setSwitch(this.activeSwitch, data.active);
    if (data.published !== undefined) await this.setSwitch(this.publishedSwitch, data.published);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Salva uma vaga nova e devolve o id criado. Na criação a página recarrega
   * em "Edit Vacancy", então o toast some antes de dar para ler: a confirmação
   * vem da resposta da API e da nova URL.
   */
  async saveAndGetId(): Promise<number> {
    const created = this.page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/api/v2/recruitment/vacancies'),
    );
    await this.save();
    expect((await created).ok()).toBeTruthy();
    // O corpo da resposta não pode ser lido: a navegação descarta o recurso.
    await expect(this.page).toHaveURL(/addJobVacancy\/\d+$/);
    return Number(this.page.url().split('/').pop());
  }

  async expectValues(data: Partial<VacancyData>): Promise<void> {
    if (data.name !== undefined) await expect(this.name.input).toHaveValue(data.name);
    if (data.jobTitle !== undefined) await this.jobTitle.expectValue(data.jobTitle);
    if (data.description !== undefined) {
      await expect(this.description.input).toHaveValue(data.description);
    }
    if (data.hiringManager !== undefined) {
      await expect(this.hiringManager.input).toHaveValue(nameMatcher(data.hiringManager));
    }
    if (data.numOfPositions !== undefined) {
      await expect(this.numOfPositions.input).toHaveValue(String(data.numOfPositions));
    }
    if (data.active !== undefined) await expect(this.activeSwitch).toBeChecked({ checked: data.active });
  }
}
