import { test, expect } from '../../fixtures';
import { ADMIN } from '../../data/users';
import { MSG } from '../../data/messages';
import { DashboardPage } from '../../pages/DashboardPage';
import { VacanciesPage } from '../../pages/VacanciesPage';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('LOGIN-01 login com credenciais válidas abre o Dashboard', { tag: '@smoke' }, async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.login(ADMIN.username, ADMIN.password);
    await dashboardPage.expectLoaded();
  });

  const invalidCredentials = [
    { id: 'LOGIN-02', title: 'senha inválida', username: ADMIN.username, password: 'senhaErrada' },
    { id: 'LOGIN-03', title: 'usuário inexistente', username: 'usuarioInexistente', password: ADMIN.password },
    { id: 'LOGIN-08', title: 'senha diferencia maiúsculas', username: ADMIN.username, password: ADMIN.password.toUpperCase() },
    { id: 'LOGIN-09', title: 'espaço antes do usuário', username: ` ${ADMIN.username}`, password: ADMIN.password },
  ];

  for (const c of invalidCredentials) {
    test(`${c.id} ${c.title} mostra "Invalid credentials"`, { tag: c.id <= 'LOGIN-03' ? '@smoke' : [] }, async ({
      loginPage,
    }) => {
      await loginPage.login(c.username, c.password);
      await loginPage.expectAlert(MSG.invalidCredentials);
      await loginPage.expectOnPage();
    });
  }

  // Tabela de decisão dos campos obrigatórios (ver cenarios.md).
  const requiredFields = [
    { id: 'LOGIN-04', title: 'usuário e senha em branco', username: '', password: '', userError: true, passError: true },
    { id: 'LOGIN-05', title: 'usuário em branco', username: '', password: ADMIN.password, userError: true, passError: false },
    { id: 'LOGIN-06', title: 'senha em branco', username: ADMIN.username, password: '', userError: false, passError: true },
  ];

  for (const c of requiredFields) {
    test(`${c.id} ${c.title} exige o preenchimento`, async ({ page, loginPage }) => {
      let loginRequested = false;
      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/auth/validate')) loginRequested = true;
      });

      await loginPage.login(c.username, c.password);

      if (c.userError) await loginPage.username.expectError(MSG.required);
      else await loginPage.username.expectNoError();
      if (c.passError) await loginPage.password.expectError(MSG.required);
      else await loginPage.password.expectNoError();
      await loginPage.expectOnPage();
      expect(loginRequested, 'o formulário não deveria ser enviado').toBe(false);
    });
  }

  test('LOGIN-07 usuário não diferencia maiúsculas de minúsculas', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(ADMIN.username.toLowerCase(), ADMIN.password);
    await dashboardPage.expectLoaded();
  });

  test('LOGIN-10 logout encerra a sessão', { tag: '@smoke' }, async ({ page, loginPage, dashboardPage }) => {
    await loginPage.login(ADMIN.username, ADMIN.password);
    await dashboardPage.expectLoaded();

    await dashboardPage.logout();
    await loginPage.expectOnPage();

    await page.goto(DashboardPage.path);
    await loginPage.expectOnPage();
  });
});

test('LOGIN-11 rota protegida sem sessão redireciona para o login', { tag: '@smoke' }, async ({
  page,
  loginPage,
}) => {
  await page.goto(VacanciesPage.path);
  await loginPage.expectOnPage();
});
