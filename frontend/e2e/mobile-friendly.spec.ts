import { expect, Page, test } from '@playwright/test';

type ViewportCase = {
  name: string;
  width: number;
  height: number;
};

const VIEWPORTS: ViewportCase[] = [
  { name: 'mobile-360x800', width: 360, height: 800 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
];

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

async function assertNoHorizontalOverflow(page: Page, context: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - window.innerWidth);
  });

  expect(overflow, `${context} - overflow horizontal detectado`).toBeLessThanOrEqual(2);
}

async function assertModalFitsViewport(page: Page, context: string) {
  const modal = page.locator('div.fixed.inset-0.z-50 > div.w-full.rounded-xl.bg-white.shadow-xl').first();
  await expect(modal, `${context} - modal não visível`).toBeVisible();

  const viewport = page.viewportSize();
  const box = await modal.boundingBox();
  expect(box, `${context} - sem bounding box`).not.toBeNull();
  if (!box || !viewport) {
    return;
  }

  expect(box.x, `${context} - modal saiu à esquerda`).toBeGreaterThanOrEqual(0);
  expect(box.y, `${context} - modal saiu no topo`).toBeGreaterThanOrEqual(0);
  expect(box.width, `${context} - modal maior que viewport`).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.height, `${context} - modal maior que viewport`).toBeLessThanOrEqual(viewport.height + 1);
}

for (const vp of VIEWPORTS) {
  test.describe(`QA responsivo - ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('login estável e sem overflow', async ({ page }) => {
      await page.goto('/auth/login');
      await expect(page.getByRole('heading', { name: 'Acesso ao sistema' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /auth/login`);
    });

    test('perfil escola: páginas e modais mobile-friendly', async ({ page }) => {
      await login(page, 'operador.escola@vacina.local', 'Escola@123');
      await expect(page).toHaveURL(/\/school\/students/);

      await expect(page.getByRole('heading', { name: 'Estudantes' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /school/students`);

      await page.getByTestId('student-form-open').click();
      await expect(page.getByText('Cadastrar estudante')).toBeVisible();
      await assertModalFitsViewport(page, `${vp.name} modal criar estudante`);
      await page.getByRole('button', { name: 'Cancelar' }).click();

      await page.goto('/school/pending');
      await expect(page).toHaveURL(/\/school\/pending/);
      await expect(page.getByRole('heading', { name: 'Pendências da escola' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /school/pending`);

      await page.goto('/school/students');
      const firstDetailButton = page.getByRole('button', { name: 'Detalhe' }).first();
      if (await firstDetailButton.count()) {
        await firstDetailButton.click();
        await expect(page).toHaveURL(/\/school\/students\/\d+/);
        await assertNoHorizontalOverflow(page, `${vp.name} /school/students/:id`);

        await page.getByTestId('vaccination-open-form').click();
        await assertModalFitsViewport(page, `${vp.name} modal vacinação`);
        await page.getByRole('button', { name: 'Cancelar' }).click();
      }
    });

    test('perfil saúde: busca ativa e dashboards mobile-friendly', async ({ page }) => {
      await login(page, 'saude@vacina.local', 'Saude@123');
      await expect(page).toHaveURL(/\/health\/search/);
      await expect(page.getByRole('heading', { name: 'Busca ativa nominal' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /health/search`);

      await page.getByTestId('health-open-dashboards').click();
      await expect(page).toHaveURL(/\/health\/dashboards/);
      await expect(page.getByRole('heading', { name: /Painel de/ })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /health/dashboards`);

      await page.getByRole('button', { name: 'Nova faixa etaria' }).click();
      await assertModalFitsViewport(page, `${vp.name} modal faixa etária`);
      await page.getByRole('button', { name: 'Cancelar' }).click();
    });

    test('perfil admin: páginas críticas e modais mobile-friendly', async ({ page }) => {
      await login(page, 'admin@vacina.local', 'Admin@123');
      await expect(page).toHaveURL(/\/admin\/students/);
      await assertNoHorizontalOverflow(page, `${vp.name} /admin/students`);

      await page.goto('/admin/schools');
      await expect(page.getByRole('heading', { name: 'Gestão de escolas' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /admin/schools`);
      await page.getByTestId('admin-school-open-create').click();
      await assertModalFitsViewport(page, `${vp.name} modal escola`);
      await page.getByRole('button', { name: 'Cancelar' }).click();

      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /admin/users`);
      await page.getByTestId('admin-user-open-create').click();
      await assertModalFitsViewport(page, `${vp.name} modal usuário`);
      await page.getByRole('button', { name: 'Cancelar' }).click();

      await page.goto('/admin/schedule');
      await expect(page.getByRole('heading', { name: 'Calendário vacinal' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /admin/schedule`);
      await page.getByTestId('admin-schedule-open-create').click();
      await assertModalFitsViewport(page, `${vp.name} modal versão calendário`);
      await page.getByRole('button', { name: 'Cancelar' }).click();

      await page.goto('/admin/monitoring');
      await expect(page.getByRole('heading', { name: 'Auditoria e logs' })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name} /admin/monitoring`);
    });
  });
}
