import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VacanciesPage } from '../pages/VacanciesPage';
import { VacancyFormPage } from '../pages/VacancyFormPage';
import { VacancyApi, type Employee, type JobTitle } from '../api/VacancyApi';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  vacanciesPage: VacanciesPage;
  vacancyFormPage: VacancyFormPage;
};

type Data = {
  vacancyApi: VacancyApi;
  jobTitle: JobTitle;
  hiringManager: Employee;
};

/**
 * Page Objects e dados de apoio entregues como fixtures: cada teste pede só o
 * que usa, e a limpeza das vagas criadas roda sempre, mesmo se o teste falhar.
 */
export const test = base.extend<Pages & Data>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  vacanciesPage: async ({ page }, use) => use(new VacanciesPage(page)),
  vacancyFormPage: async ({ page }, use) => use(new VacancyFormPage(page)),

  vacancyApi: async ({ page }, use) => {
    const api = new VacancyApi(page.request);
    await use(api);
    await api.cleanup();
  },
  jobTitle: async ({ vacancyApi }, use) => use(await vacancyApi.getJobTitle()),
  hiringManager: async ({ vacancyApi }, use) => use(await vacancyApi.getHiringManager()),
});

export { expect } from '@playwright/test';
