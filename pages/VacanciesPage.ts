import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SelectField } from './components/FormField';

export interface VacancyFilters {
  jobTitle?: string;
  vacancy?: string;
  hiringManager?: string;
  status?: 'Active' | 'Closed';
}

export interface VacancyRow {
  vacancy: string;
  jobTitle: string;
  hiringManager: string;
  status: string;
}

/** Listagem Recruitment › Vacancies: filtros, tabela e diálogo de exclusão. */
export class VacanciesPage extends BasePage {
  static readonly path = '/web/index.php/recruitment/viewJobVacancy';

  readonly filterArea: Locator;
  readonly jobTitleFilter: SelectField;
  readonly vacancyFilter: SelectField;
  readonly hiringManagerFilter: SelectField;
  readonly statusFilter: SelectField;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly addButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly recordsFound: Locator;
  readonly rows: Locator;
  readonly confirmDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.filterArea = page.locator('.oxd-table-filter');
    this.jobTitleFilter = new SelectField(page, this.filterArea, 'Job Title');
    this.vacancyFilter = new SelectField(page, this.filterArea, 'Vacancy');
    this.hiringManagerFilter = new SelectField(page, this.filterArea, 'Hiring Manager');
    this.statusFilter = new SelectField(page, this.filterArea, 'Status');
    this.searchButton = this.filterArea.getByRole('button', { name: 'Search' });
    this.resetButton = this.filterArea.getByRole('button', { name: 'Reset' });
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.deleteSelectedButton = page.getByRole('button', { name: 'Delete Selected' });
    this.recordsFound = page.locator('.orangehrm-horizontal-padding .oxd-text--span');
    this.rows = page.locator('.oxd-table-body .oxd-table-card');
    this.confirmDialog = page.locator('.oxd-dialog-sheet');
  }

  async goto(): Promise<void> {
    await this.untilListLoaded(() => this.page.goto(VacanciesPage.path));
    await expect(this.pageTitle).toHaveText('Recruitment');
  }

  /**
   * Executa a ação e espera a tabela ser recarregada. Esperar só o spinner sumir
   * não basta: logo após o clique ele ainda nem apareceu e a tabela antiga é lida.
   */
  private async untilListLoaded(action: () => Promise<unknown>): Promise<void> {
    const listResponse = this.page.waitForResponse(
      (r) => r.request().method() === 'GET' && /\/api\/v2\/recruitment\/vacancies\?/.test(r.url()),
    );
    await action();
    await listResponse;
    await this.waitForLoad();
    await expect(this.recordsFound).toBeVisible();
  }

  row(vacancyName: string): Locator {
    return this.rows.filter({
      has: this.page.getByRole('cell', { name: vacancyName, exact: true }),
    });
  }

  async search(filters: VacancyFilters): Promise<void> {
    if (filters.jobTitle) await this.jobTitleFilter.choose(filters.jobTitle);
    if (filters.vacancy) await this.vacancyFilter.choose(filters.vacancy);
    if (filters.hiringManager) await this.hiringManagerFilter.choose(filters.hiringManager);
    if (filters.status) await this.statusFilter.choose(filters.status);
    await this.untilListLoaded(() => this.searchButton.click());
  }

  async reset(): Promise<void> {
    await this.untilListLoaded(() => this.resetButton.click());
  }

  /** Lê a tabela inteira como objetos — facilita asserções sobre todas as linhas. */
  async readRows(): Promise<VacancyRow[]> {
    const result: VacancyRow[] = [];
    for (const row of await this.rows.all()) {
      const cells = (await row.getByRole('cell').allInnerTexts()).map((c) => c.trim());
      // cells[0] é o checkbox, o último é a coluna de ações.
      const [, vacancy, jobTitle, hiringManager, status] = cells;
      result.push({ vacancy, jobTitle, hiringManager, status });
    }
    return result;
  }

  async recordsCount(): Promise<number> {
    const text = (await this.recordsFound.innerText()).trim();
    if (text === 'No Records Found') return 0;
    return Number(text.match(/\((\d+)\)/)?.[1]);
  }

  async clickEdit(vacancyName: string): Promise<void> {
    await this.row(vacancyName).locator('button:has(.bi-pencil-fill)').click();
  }

  async clickDelete(vacancyName: string): Promise<void> {
    await this.row(vacancyName).locator('button:has(.bi-trash)').click();
    await expect(this.confirmDialog).toBeVisible();
  }

  async selectRow(vacancyName: string): Promise<void> {
    await this.row(vacancyName).locator('.oxd-checkbox-input').click();
  }

  async confirmDelete(): Promise<void> {
    await this.confirmDialog.getByRole('button', { name: 'Yes, Delete' }).click();
    await expect(this.confirmDialog).toBeHidden();
  }

  async cancelDelete(): Promise<void> {
    await this.confirmDialog.getByRole('button', { name: 'No, Cancel' }).click();
    await expect(this.confirmDialog).toBeHidden();
  }
}
