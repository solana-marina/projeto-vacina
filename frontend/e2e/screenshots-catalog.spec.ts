import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Page, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../telas');

const MANIFEST_FILES = [
  '01-login.png',
  '10-school-students.png',
  '11-school-student-create-modal.png',
  '12-school-student-detail.png',
  '13-school-vaccination-modal.png',
  '14-school-future-vaccines-modal.png',
  '15-school-pending.png',
  '20-health-search.png',
  '21-health-dashboards.png',
  '22-health-age-bucket-modal.png',
  '30-admin-students.png',
  '31-admin-schools.png',
  '32-admin-school-modal.png',
  '33-admin-users.png',
  '34-admin-user-modal.png',
  '35-admin-schedule.png',
  '36-admin-schedule-version-modal.png',
  '37-admin-schedule-rule-modal.png',
  '38-admin-vaccine-modal.png',
  '39-admin-dashboards.png',
  '40-admin-monitoring-audit.png',
  '41-admin-monitoring-audit-detail-modal.png',
  '42-admin-monitoring-error.png',
  '43-admin-monitoring-error-detail-modal.png',
];

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1440, height: 900 } });

async function prepareOutputDirectory() {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await Promise.all(
    MANIFEST_FILES.map(async (fileName) => {
      const targetPath = path.join(SCREENSHOTS_DIR, fileName);
      try {
        await fs.unlink(targetPath);
      } catch {
        // no-op when file does not exist
      }
    }),
  );
}

async function capture(page: Page, fileName: string, fullPage = true) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, fileName), fullPage });
}

async function login(page: Page, email: string, password: string, destination: RegExp) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(destination);
}

async function logout(page: Page) {
  await expect(page.getByTestId('logout-button')).toBeVisible();
  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/\/auth\/login/);
}

async function closeModal(page: Page, label = 'Cancelar') {
  const modalOverlay = page.locator('div.fixed.inset-0.z-50').last();
  await expect(modalOverlay).toBeVisible();
  await modalOverlay.getByRole('button', { name: label }).click();
  await expect(modalOverlay).toBeHidden();
}

async function closeModalWithEscape(page: Page) {
  const modalOverlay = page.locator('div.fixed.inset-0.z-50').last();
  await expect(modalOverlay).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modalOverlay).toBeHidden();
}

async function openSchoolStudentWithFutureVaccines(page: Page) {
  await page.goto('/school/students');
  const detailButtons = page.getByRole('button', { name: 'Detalhe' });
  const totalButtons = await detailButtons.count();

  for (let index = 0; index < totalButtons; index += 1) {
    await page.goto('/school/students');
    const currentButton = page.getByRole('button', { name: 'Detalhe' }).nth(index);
    await expect(currentButton).toBeVisible();
    await currentButton.click();
    await expect(page).toHaveURL(/\/school\/students\/\d+/);

    const futureButton = page.getByRole('button', { name: 'Vacinas futuras' });
    if (await futureButton.isEnabled()) {
      return;
    }
  }

  throw new Error('Nao foi encontrado estudante com "Vacinas futuras" habilitado.');
}

async function ensureMonitoringRows(page: Page, tab: 'audit' | 'error') {
  const rows = page.locator('tbody tr');
  if ((await rows.count()) > 0) {
    return;
  }

  if (tab === 'error') {
    await page.request.get('/api/students/', { failOnStatusCode: false });
    await page.waitForTimeout(500);
    await page.reload();
    await page.getByRole('button', { name: 'Logs de erro' }).click();
    await page.waitForTimeout(500);
  }

  await expect(page.locator('tbody tr').first()).toBeVisible();
}

test('gera catalogo de telas e modais em /telas', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);
  await prepareOutputDirectory();

  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Acesso ao sistema' })).toBeVisible();
  await capture(page, '01-login.png');

  // Gera ao menos um ErrorLog via tentativa de login invalida.
  await page.getByTestId('login-email').fill('admin@vacina.local');
  await page.getByTestId('login-password').fill('Senha@Invalida');
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/auth\/login/);

  await login(page, 'operador.escola@vacina.local', 'Escola@123', /\/school\/students/);
  await expect(page.getByRole('heading', { name: 'Estudantes' })).toBeVisible();
  await capture(page, '10-school-students.png');

  await page.getByTestId('student-form-open').click();
  await expect(page.getByRole('heading', { name: 'Cadastrar estudante' })).toBeVisible();
  await capture(page, '11-school-student-create-modal.png', false);
  await closeModal(page);

  await page.getByRole('button', { name: 'Detalhe' }).first().click();
  await expect(page).toHaveURL(/\/school\/students\/\d+/);
  await expect(page.getByText('Registros vacinais')).toBeVisible();
  await capture(page, '12-school-student-detail.png');

  await page.getByTestId('vaccination-open-form').click();
  await expect(page.getByRole('heading', { name: 'Adicionar registro vacinal' })).toBeVisible();
  await capture(page, '13-school-vaccination-modal.png', false);
  await closeModal(page);

  if (!(await page.getByRole('button', { name: 'Vacinas futuras' }).isEnabled())) {
    await openSchoolStudentWithFutureVaccines(page);
  }
  await page.getByRole('button', { name: 'Vacinas futuras' }).click();
  await expect(page.getByRole('heading', { name: 'Vacinas futuras' })).toBeVisible();
  await capture(page, '14-school-future-vaccines-modal.png', false);
  await closeModal(page, 'Fechar');

  await page.goto('/school/pending');
  await expect(page).toHaveURL(/\/school\/pending/);
  await expect(page.getByRole('heading', { name: 'Pendências da escola' })).toBeVisible();
  await capture(page, '15-school-pending.png');

  await logout(page);

  await login(page, 'saude@vacina.local', 'Saude@123', /\/health\/search/);
  await expect(page.getByRole('heading', { name: 'Busca ativa nominal' })).toBeVisible();
  await capture(page, '20-health-search.png');

  await page.goto('/health/dashboards');
  await expect(page).toHaveURL(/\/health\/dashboards/);
  await expect(page.getByRole('heading', { name: 'Painel de saude' })).toBeVisible();
  await capture(page, '21-health-dashboards.png');

  await page.getByRole('button', { name: 'Nova faixa etaria' }).click();
  await expect(page.getByRole('heading', { name: 'Nova faixa etaria' })).toBeVisible();
  await capture(page, '22-health-age-bucket-modal.png', false);
  await closeModal(page);

  await logout(page);

  await login(page, 'admin@vacina.local', 'Admin@123', /\/admin\/students/);
  await expect(page.getByRole('heading', { name: 'Estudantes' })).toBeVisible();
  await capture(page, '30-admin-students.png');

  await page.goto('/admin/schools');
  await expect(page).toHaveURL(/\/admin\/schools/);
  await expect(page.getByRole('heading', { name: 'Gestão de escolas' })).toBeVisible();
  await capture(page, '31-admin-schools.png');

  await page.getByTestId('admin-school-open-create').click();
  await expect(page.getByRole('heading', { name: 'Nova escola' })).toBeVisible();
  await capture(page, '32-admin-school-modal.png', false);

  // Gera ao menos um AuditLog via criacao real de escola.
  const uniqueSchoolName = `Escola Screenshot ${Date.now()}`;
  await page.getByTestId('admin-school-name').fill(uniqueSchoolName);
  await page.getByTestId('admin-school-save').click();
  await expect(page.locator('div.fixed.inset-0.z-50')).toBeHidden();
  await expect(page.getByText(uniqueSchoolName)).toBeVisible();

  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
  await capture(page, '33-admin-users.png');

  await page.getByTestId('admin-user-open-create').click();
  await expect(page.getByRole('heading', { name: 'Novo usuário' })).toBeVisible();
  await capture(page, '34-admin-user-modal.png', false);
  await closeModal(page);

  await page.goto('/admin/schedule');
  await expect(page).toHaveURL(/\/admin\/schedule/);
  await expect(page.getByRole('heading', { name: 'Calendário vacinal' })).toBeVisible();
  await capture(page, '35-admin-schedule.png');

  await page.getByTestId('admin-schedule-open-create').click();
  await expect(page.getByRole('heading', { name: 'Nova versão de calendário' })).toBeVisible();
  await capture(page, '36-admin-schedule-version-modal.png', false);
  await closeModal(page);

  await page.getByTestId('admin-rule-open-create').click();
  await expect(page.getByRole('heading', { name: 'Nova regra' })).toBeVisible();
  await capture(page, '37-admin-schedule-rule-modal.png', false);
  await closeModal(page);

  await page.getByTestId('admin-vaccine-open-create').click();
  await expect(page.getByRole('heading', { name: 'Adicionar vacina' })).toBeVisible();
  await capture(page, '38-admin-vaccine-modal.png', false);
  await closeModal(page);

  await page.goto('/admin/dashboards');
  await expect(page).toHaveURL(/\/admin\/dashboards/);
  await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeVisible();
  await capture(page, '39-admin-dashboards.png');

  await page.goto('/admin/monitoring');
  await expect(page).toHaveURL(/\/admin\/monitoring/);
  await expect(page.getByRole('heading', { name: 'Auditoria e logs' })).toBeVisible();
  await ensureMonitoringRows(page, 'audit');
  await capture(page, '40-admin-monitoring-audit.png');

  await page.locator('tbody').getByRole('button', { name: 'Ver' }).first().click();
  await expect(page.getByRole('heading', { name: 'Detalhes da auditoria' })).toBeVisible();
  await capture(page, '41-admin-monitoring-audit-detail-modal.png', false);
  await closeModalWithEscape(page);

  await page.getByRole('button', { name: 'Logs de erro' }).click();
  await ensureMonitoringRows(page, 'error');
  await capture(page, '42-admin-monitoring-error.png');

  await page.locator('tbody').getByRole('button', { name: 'Ver' }).first().click();
  await expect(page.getByRole('heading', { name: 'Detalhes do erro' })).toBeVisible();
  await capture(page, '43-admin-monitoring-error-detail-modal.png', false);
  await closeModalWithEscape(page);

  await Promise.all(
    MANIFEST_FILES.map(async (fileName) => {
      const targetPath = path.join(SCREENSHOTS_DIR, fileName);
      const stat = await fs.stat(targetPath);
      expect(stat.size).toBeGreaterThan(0);
    }),
  );
});
