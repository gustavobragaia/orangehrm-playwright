import { test, expect } from '../../fixtures';
import { MSG } from '../../data/messages';
import { uniqueVacancyName } from '../../data/vacancy.factory';
import type { CreatedVacancy } from '../../api/VacancyApi';

test.describe('Recruitment › Vacancies › Pesquisa', () => {
  let vacancy: CreatedVacancy;

  test.beforeEach(async ({ vacancyApi, jobTitle, hiringManager, vacanciesPage }) => {
    vacancy = await vacancyApi.create({ name: uniqueVacancyName(), jobTitle, hiringManager });
    await vacanciesPage.goto();
  });

  test('VAC-SEARCH-01 pesquisar por Vacancy retorna só a vaga', { tag: '@smoke' }, async ({ vacanciesPage }) => {
    await vacanciesPage.search({ vacancy: vacancy.name });

    await expect(vacanciesPage.recordsFound).toHaveText('(1) Record Found');
    expect(await vacanciesPage.readRows()).toEqual([
      { vacancy: vacancy.name, jobTitle: vacancy.jobTitle, hiringManager: vacancy.hiringManager, status: 'Active' },
    ]);
  });

  test('VAC-SEARCH-02 pesquisar por Job Title', async ({ vacanciesPage }) => {
    await vacanciesPage.search({ jobTitle: vacancy.jobTitle });

    const rows = await vacanciesPage.readRows();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.jobTitle === vacancy.jobTitle)).toBe(true);
    expect(rows.map((r) => r.vacancy)).toContain(vacancy.name);
  });

  test('VAC-SEARCH-03 pesquisar por Status Closed', async ({ vacanciesPage, vacancyApi, jobTitle, hiringManager }) => {
    const closed = await vacancyApi.create({ name: uniqueVacancyName(), jobTitle, hiringManager, active: false });
    await vacanciesPage.goto();

    await vacanciesPage.search({ status: 'Closed' });

    const rows = await vacanciesPage.readRows();
    expect(rows.map((r) => r.vacancy)).toContain(closed.name);
    expect(rows.every((r) => r.status === 'Closed')).toBe(true);
  });

  test('VAC-SEARCH-04 combinação de filtros sem resultado', async ({ vacanciesPage }) => {
    await vacanciesPage.search({ vacancy: vacancy.name, status: 'Closed' });

    await vacanciesPage.toast.expectMessage(MSG.noRecords);
    await expect(vacanciesPage.recordsFound).toHaveText(MSG.noRecords);
    await expect(vacanciesPage.rows).toHaveCount(0);
  });

  test('VAC-SEARCH-05 Reset limpa os filtros', async ({ vacanciesPage }) => {
    await vacanciesPage.search({ vacancy: vacancy.name });
    await expect(vacanciesPage.rows).toHaveCount(1);

    await vacanciesPage.reset();

    await vacanciesPage.vacancyFilter.expectValue('-- Select --');
    expect(await vacanciesPage.recordsCount()).toBeGreaterThan(1);
  });
});
