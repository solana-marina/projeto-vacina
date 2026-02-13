import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'cmd /c \"python manage.py migrate && python manage.py seed_demo --reset && python manage.py runserver 8000\"',
      cwd: '../backend',
      url: 'http://127.0.0.1:8000/api/docs/',
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run start -- --host 127.0.0.1 --port 4200',
      cwd: '.',
      url: 'http://127.0.0.1:4200',
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
