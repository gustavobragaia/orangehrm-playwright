import { test, expect } from '../../fixtures';
import { MSG } from '../../data/messages';
import { uniqueVacancyName } from '../../data/vacancy.factory';

test.describe('Recruitment › Vacancies › Deleção', () => {
  test('VAC-DEL-01 excluir vaga pela linha da tabela', { tag: '@smoke' }, async ({
    vacanciesPage,
    vacancyApi,
    jobTitle,
    hiringManager,
  }) => {
    const vacancy = await vacancyApi.create({ name: uniqueVacancyName(), jobTitle, hiringManager });
    await vacanciesPage.goto();
    await vacanciesPage.search({ vacancy: vacancy.name });

    await vacanciesPage.clickDelete(vacancy.name);
    await expect(vacanciesPage.confirmDialog).toContainText('Are you Sure?');
    await vacanciesPage.confirmDelete();

    await vacanciesPage.toast.expectMessage(MSG.deleted);
    await expect(vacanciesPage.row(vacancy.name)).toHaveCount(0);
    expect(await vacancyApi.findByName(vacancy.name)).toBeUndefined();
  });

  test('VAC-DEL-02 cancelar a exclusão mantém a vaga', async ({ vacanciesPage, vacancyApi, jobTitle, hiringManager }) => {
    const vacancy = await vacancyApi.create({ name: uniqueVacancyName(), jobTitle, hiringManager });
    await vacanciesPage.goto();
    await vacanciesPage.search({ vacancy: vacancy.name });

    await vacanciesPage.clickDelete(vacancy.name);
    await vacanciesPage.cancelDelete();

    await expect(vacanciesPage.row(vacancy.name)).toBeVisible();
    expect(await vacancyApi.findByName(vacancy.name)).toBeDefined();
  });

  test('VAC-DEL-03 excluir várias vagas selecionadas', async ({ vacanciesPage, vacancyApi, jobTitle, hiringManager }) => {
    const prefix = uniqueVacancyName('PW Lote');
    const first = await vacancyApi.create({ name: `${prefix} A`, jobTitle, hiringManager });
    const second = await vacancyApi.create({ name: `${prefix} B`, jobTitle, hiringManager });
    await vacanciesPage.goto();
    // As duas vagas novas compartilham o Job Title; sem filtro elas podem cair em outra página.
    await vacanciesPage.search({ jobTitle: jobTitle.title });

    await vacanciesPage.selectRow(first.name);
    await vacanciesPage.selectRow(second.name);
    await vacanciesPage.deleteSelectedButton.click();
    await vacanciesPage.confirmDelete();

    await vacanciesPage.toast.expectMessage(MSG.deleted);
    expect(await vacancyApi.findByName(first.name)).toBeUndefined();
    expect(await vacancyApi.findByName(second.name)).toBeUndefined();
  });
});
