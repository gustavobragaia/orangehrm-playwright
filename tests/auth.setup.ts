import { test as setup } from '../fixtures';
import { STORAGE_STATE } from '../playwright.config';
import { ADMIN } from '../data/users';

// Faz login uma vez e reaproveita a sessão nos testes de Recruitment.
setup('autenticar como Admin', async ({ page, loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login(ADMIN.username, ADMIN.password);
  await dashboardPage.expectLoaded();
  await page.context().storageState({ path: STORAGE_STATE });
});
