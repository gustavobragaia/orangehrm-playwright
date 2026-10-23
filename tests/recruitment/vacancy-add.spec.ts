import { test, expect } from '../../fixtures';
import { MSG } from '../../data/messages';
import { uniqueVacancyName } from '../../data/vacancy.factory';

test.describe('Recruitment › Vacancies › Adição', () => {
  test.beforeEach(async ({ vacancyFormPage }) => {
    await vacancyFormPage.gotoAdd();
  });

  test('VAC-ADD-01 adicionar vaga com todos os campos', { tag: '@smoke' }, async ({
    vacancyFormPage,
    vacanciesPage,
    vacancyApi,
    jobTitle,
    hiringManager,
  }) => {
    const vacancy = {
      name: uniqueVacancyName(),
      jobTitle: jobTitle.title,
      hiringManager: hiringManager.fullName,
      description: 'Vaga criada pela automação Playwright',
      numOfPositions: 3,
      active: true,
      published: true,
    };

    await vacancyFormPage.fill(vacancy);
    const id = await vacancyFormPage.saveAndGetId();
    vacancyApi.track(id);

    await vacancyFormPage.expectHeading('Edit Vacancy');
    await vacancyFormPage.expectValues(vacancy);

    await vacanciesPage.goto();
    await vacanciesPage.search({ vacancy: vacancy.name });
    expect(await vacanciesPage.readRows()).toEqual([
      { vacancy: vacancy.name, jobTitle: jobTitle.title, hiringManager: hiringManager.fullName, status: 'Active' },
    ]);
  });

  test('VAC-ADD-02 adicionar vaga só com os campos obrigatórios', { tag: '@smoke' }, async ({
    vacancyFormPage,
    vacancyApi,
    jobTitle,
    hiringManager,
  }) => {
    const vacancy = { name: uniqueVacancyName(), jobTitle: jobTitle.title, hiringManager: hiringManager.fullName };

    await vacancyFormPage.fill(vacancy);
    vacancyApi.track(await vacancyFormPage.saveAndGetId());

    await vacancyFormPage.expectValues({ ...vacancy, description: '', active: true });
  });

  test('VAC-ADD-03 salvar formulário vazio aponta os obrigatórios', async ({ page, vacancyFormPage }) => {
    await vacancyFormPage.save();

    await vacancyFormPage.name.expectError(MSG.required);
    await vacancyFormPage.jobTitle.expectError(MSG.required);
    await vacancyFormPage.hiringManager.expectError(MSG.required);
    await vacancyFormPage.description.expectNoError();
    await vacancyFormPage.numOfPositions.expectNoError();
    await expect(page).toHaveURL(/addJobVacancy$/);
  });

  test('VAC-ADD-04 nome de vaga duplicado não é aceito', async ({
    vacancyFormPage,
    vacancyApi,
    jobTitle,
    hiringManager,
  }) => {
    const existing = await vacancyApi.create({ name: uniqueVacancyName(), jobTitle, hiringManager });

    await vacancyFormPage.name.input.fill(existing.name);

    await vacancyFormPage.name.expectError(MSG.alreadyExists);
  });

  for (const value of ['1', '99']) {
    test(`VAC-ADD-05 Number of Positions aceita o limite ${value}`, async ({ vacancyFormPage }) => {
      await vacancyFormPage.numOfPositions.input.fill(value);
      await vacancyFormPage.numOfPositions.input.blur();
      await vacancyFormPage.numOfPositions.expectNoError();
    });
  }

  for (const value of ['0', '100']) {
    test(`VAC-ADD-06 Number of Positions recusa o limite ${value}`, async ({ vacancyFormPage }) => {
      await vacancyFormPage.numOfPositions.input.fill(value);
      await vacancyFormPage.numOfPositions.expectError(MSG.positionsRange);
    });
  }

  for (const value of ['abc', '-1', '1.5']) {
    test(`VAC-ADD-07 Number of Positions recusa "${value}"`, async ({ vacancyFormPage }) => {
      await vacancyFormPage.numOfPositions.input.fill(value);
      await vacancyFormPage.numOfPositions.expectError(MSG.numeric);
    });
  }

  test('VAC-ADD-08 Hiring Manager digitado sem escolher da lista é inválido', async ({
    vacancyFormPage,
    jobTitle,
  }) => {
    await vacancyFormPage.fill({ name: uniqueVacancyName(), jobTitle: jobTitle.title });
    await vacancyFormPage.hiringManager.input.fill('Funcionario Que Nao Existe');
    await vacancyFormPage.save();

    await vacancyFormPage.hiringManager.expectError(MSG.invalid);
    await vacancyFormPage.expectHeading('Add Vacancy');
  });

  test('VAC-ADD-09 cancelar a adição não cria a vaga', async ({
    page,
    vacancyFormPage,
    vacanciesPage,
    vacancyApi,
    jobTitle,
  }) => {
    const name = uniqueVacancyName();
    await vacancyFormPage.fill({ name, jobTitle: jobTitle.title });

    await vacancyFormPage.cancelButton.click();

    await expect(page).toHaveURL(/viewJobVacancy$/);
    await vacanciesPage.waitForLoad();
    expect(await vacancyApi.findByName(name)).toBeUndefined();
  });
});
