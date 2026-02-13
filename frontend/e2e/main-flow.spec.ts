import { expect, test } from '@playwright/test';

test('fluxo principal escola + saúde + export CSV', async ({ page }) => {
  const unique = Date.now();
  const studentName = `Aluno E2E ${unique}`;

  await page.goto('/auth/login');

  await page.getByTestId('login-email').fill('operador.escola@vacina.local');
  await page.getByTestId('login-password').fill('Escola@123');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/school\/students/);

  await page.getByTestId('student-form-open').click();
  await page.getByTestId('student-form-name').fill(studentName);
  await page.getByTestId('student-form-birth-date').fill('2020-01-01');
  await page.getByTestId('student-form-save').click();

  await page.getByTestId('students-filter-name').fill(studentName);
  await page.getByTestId('students-filter-submit').click();

  await expect(page.getByText(studentName)).toBeVisible();
  await page.locator('tbody tr', { hasText: studentName }).getByRole('button', { name: 'Detalhe' }).click();

  await expect(page).toHaveURL(/\/school\/students\//);
  await page.getByTestId('vaccination-open-form').click();
  await page.getByTestId('vaccination-dose').fill('1');
  await page.getByTestId('vaccination-date').fill('2025-01-15');
  const saveVaccinationResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/students/') &&
      response.url().includes('/vaccinations/'),
  );
  await page.getByTestId('vaccination-save').click();
  await expect((await saveVaccinationResponse).status()).toBe(201);

  await expect(page.getByText('Registros vacinais')).toBeVisible();
  await expect(page.getByText('Situação vacinal')).toBeVisible();

  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/\/auth\/login/);

  await page.getByTestId('login-email').fill('saude@vacina.local');
  await page.getByTestId('login-password').fill('Saude@123');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/health\/search/);
  await page.getByTestId('health-search-name').fill(studentName);
  await page.getByTestId('health-search-submit').click();

  await expect(page.locator('table tbody tr').first()).toBeVisible();

  await page.getByTestId('health-go-dashboards').click();
  await expect(page).toHaveURL(/\/health\/dashboards/);
  await expect(page.getByRole('heading', { name: 'Cobertura por escola' })).toBeVisible();

  await page.goto('/health/search');
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('health-export-csv').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.csv');
});
