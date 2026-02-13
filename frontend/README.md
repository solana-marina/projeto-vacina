# Frontend Final (React + Vite)

Este diretório (`frontend/`) contém **somente o frontend final em React** do Projeto de Vacinação Contra o HPV.

## Estrutura principal
- `src-react/`: código-fonte React oficial.
- `e2e/`: testes Playwright.
- `vite.config.ts`: configuração do Vite e proxy `/api`.
- `playwright.config.ts`: configuração de testes E2E.

## Scripts
- `npm run start`: inicia ambiente local em `http://localhost:4200`
- `npm run build`: valida TypeScript e gera build de produção
- `npm run test:unit`: executa testes unitários (Vitest)
- `npm run e2e`: executa testes ponta a ponta (Playwright)

## Legado
O frontend Angular antigo foi movido para:
- `legacy/frontend-angular/`

Referências visuais antigas foram movidas para:
- `legacy/rework-visual-reference/`
