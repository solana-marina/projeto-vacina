import { expect, Page, test } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('fluxo admin: escolas, usuários, calendário, estudantes, dashboards e monitoramento', async ({ page }) => {
  const unique = Date.now();
  const schoolName = `Escola Admin ${unique}`;
  const userEmail = `admin.flow.${unique}@vacina.local`;
  const vaccineCode = `HPV_ADMIN_${unique}`;
  const scheduleCode = `SCHED_ADMIN_${unique}`;

  await login(page, 'admin@vacina.local', 'Admin@123');
  await expect(page).toHaveURL(/\/admin\/students/);

  await page.goto('/admin/schools');
  await page.getByTestId('admin-school-open-create').click();
  await page.getByTestId('admin-school-name').fill(schoolName);
  await page.getByTestId('admin-school-save').click();
  await expect(page.getByText(schoolName)).toBeVisible();

  await page.getByTestId('admin-nav-users').click();
  await expect(page).toHaveURL(/\/admin\/users/);
  await page.getByTestId('admin-user-open-create').click();
  await page.getByTestId('admin-user-email').fill(userEmail);
  await page.getByTestId('admin-user-full-name').fill('Usuario Admin Flow');
  await page.getByTestId('admin-user-password').fill('Admin@123');
  await page.getByTestId('admin-user-save').click();
  await expect(page.getByText(userEmail)).toBeVisible();

  await page.getByTestId('admin-nav-schedule').click();
  await expect(page).toHaveURL(/\/admin\/schedule/);

  await page.getByTestId('admin-vaccine-open-create').click();
  await page.getByTestId('admin-vaccine-code').fill(vaccineCode);
  await page.getByTestId('admin-vaccine-name').fill(`Vacina ${vaccineCode}`);
  await page.getByTestId('admin-vaccine-save').click();
  await expect(page.getByRole('cell', { name: vaccineCode, exact: true })).toBeVisible();

  await page.getByTestId('admin-schedule-open-create').click();
  await page.getByTestId('admin-schedule-code').fill(scheduleCode);
  await page.getByTestId('admin-schedule-name').fill(`Calendario ${scheduleCode}`);
  await page.getByTestId('admin-schedule-save').click();
  await expect(page.getByRole('cell', { name: scheduleCode, exact: true })).toBeVisible();

  await page.getByTestId('admin-rule-open-create').click();
  await page.getByTestId('admin-rule-dose-number').fill('99');
  await page.getByTestId('admin-rule-min-years').fill('9');
  await page.getByTestId('admin-rule-min-months').fill('0');
  await page.getByTestId('admin-rule-max-years').fill('14');
  await page.getByTestId('admin-rule-max-months').fill('11');
  await page.getByTestId('admin-rule-save').click();
  await expect(page.getByText('Regras da versão selecionada')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTestId('admin-nav-dashboards').click();
  await expect(page).toHaveURL(/\/admin\/dashboards/);
  await expect(page.getByRole('heading', { name: 'Cobertura por escola' })).toBeVisible();

  await page.getByTestId('admin-nav-monitoring').click();
  await expect(page).toHaveURL(/\/admin\/monitoring/);
  await expect(page.getByRole('heading', { name: 'Auditoria e logs' })).toBeVisible();
});

test('fluxo escola: pendências e filtros', async ({ page }) => {
  await login(page, 'gestor.escola@vacina.local', 'Escola@123');
  await expect(page).toHaveURL(/\/school\/students/);

  await page.getByTestId('school-go-pending').click();
  await expect(page).toHaveURL(/\/school\/pending/);
  await expect(page.getByText('Pendências da escola')).toBeVisible();

  await page.getByRole('button', { name: 'Atualizar lista' }).click();
  await expect(page.locator('table')).toBeVisible();
});

test('fluxo saúde: dashboards consolidados', async ({ page }) => {
  await login(page, 'gestor.saude@vacina.local', 'Saude@123');
  await expect(page).toHaveURL(/\/health\/search/);

  await page.getByTestId('health-go-dashboards').click();
  await expect(page).toHaveURL(/\/health\/dashboards/);
  await expect(page.getByRole('heading', { name: 'Cobertura por escola' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Distribuição de pendências por faixa etária' })).toBeVisible();
});
