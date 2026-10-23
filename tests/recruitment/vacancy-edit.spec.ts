import { test, expect } from '../../fixtures';
import { MSG } from '../../data/messages';
import { uniqueVacancyName } from '../../data/vacancy.factory';
import type { CreatedVacancy } from '../../api/VacancyApi';

test.describe('Recruitment › Vacancies › Edição', () => {
  let vacancy: CreatedVacancy;

  test.beforeEach(async ({ vacancyApi, jobTitle, hiringManager }) => {
    vacancy = await vacancyApi.create({
      name: uniqueVacancyName(),
      jobTitle,
      hiringManager,
      numOfPositions: 2,
      description: 'Descrição original',
    });
  });

  test('VAC-EDIT-01 editar nome, descrição e posições pela listagem', { tag: '@smoke' }, async ({
    page,
    vacanciesPage,
    vacancyFormPage,
  }) => {
    const changes = { name: `${vacancy.name} editada`, description: 'Descrição alterada', numOfPositions: 5 };

    await vacanciesPage.goto();
    await vacanciesPage.search({ vacancy: vacancy.name });
    await vacanciesPage.clickEdit(vacancy.name);
    await expect(page).toHaveURL(new RegExp(`addJobVacancy/${vacancy.id}$`));
    await expect(vacancyFormPage.name.input).toHaveValue(vacancy.name);

    await vacancyFormPage.fill(changes);
    await vacancyFormPage.save();
    await vacancyFormPage.toast.expectMessage(MSG.saved);

    await vacanciesPage.goto();
    await vacanciesPage.search({ vacancy: changes.name });
    await expect(vacanciesPage.row(changes.name)).toBeVisible();

    await vacancyFormPage.gotoEdit(vacancy.id);
    await vacancyFormPage.expectValues(changes);
  });

  test('VAC-EDIT-02 formulário de edição carrega os dados atuais', async ({ vacancyFormPage }) => {
    await vacancyFormPage.gotoEdit(vacancy.id);

    await vacancyFormPage.expectValues({
      name: vacancy.name,
      jobTitle: vacancy.jobTitle,
      hiringManager: vacancy.hiringManager,
      description: 'Descrição original',
      numOfPositions: 2,
      active: true,
    });
  });

  test('VAC-EDIT-03 inativar a vaga muda o status para Closed', async ({ vacancyFormPage, vacanciesPage }) => {
    await vacancyFormPage.gotoEdit(vacancy.id);
    await vacancyFormPage.fill({ active: false });
    await vacancyFormPage.save();
    await vacancyFormPage.toast.expectMessage(MSG.saved);

    // Vaga fechada deixa de ser oferecida no filtro "Vacancy"; busca por Job Title + Status.
    await vacanciesPage.goto();
    await vacanciesPage.search({ jobTitle: vacancy.jobTitle, status: 'Closed' });
    await expect(vacanciesPage.row(vacancy.name).getByRole('cell').nth(4)).toHaveText('Closed');
  });

  test('VAC-EDIT-04 apagar o nome na edição exige o preenchimento', async ({ vacancyFormPage, vacancyApi }) => {
    await vacancyFormPage.gotoEdit(vacancy.id);
    await vacancyFormPage.name.input.clear();
    await vacancyFormPage.save();

    await vacancyFormPage.name.expectError(MSG.required);
    expect(await vacancyApi.findByName(vacancy.name)).toBeDefined();
  });
});
