# Testes

## Estratégia
Pirâmide aplicada:
1. Unitários (maior base)
2. Integração de API (pytest + banco de teste)
3. E2E (Playwright) cobrindo o fluxo principal

## Backend
### Ferramentas
- `pytest`
- `pytest-django`
- `pytest-cov`
- `factory_boy`
- `Faker`

### Rodar
```powershell
cd backend
pytest -q
```

### Casos obrigatórios cobertos
- Motor de regras de imunização (EM_DIA, ATRASADO, INCOMPLETO, SEM_DADOS)
- Segregação entre escolas
- Endpoints críticos:
  - `immunization-status`
  - dashboards
  - permissões de acesso

### Cobertura backend
- XML: `backend/coverage.xml`
- HTML: `backend/htmlcov/index.html`

## Frontend unitário
### Ferramentas
- Angular TestBed + Karma/Jasmine

### Rodar
```powershell
cd frontend
npm run test:unit
```

### Escopo unitário coberto
- `AuthService`
- `TokenStorageService`
- `AuthGuard`
- `RoleGuard`
- `JwtInterceptor`
- `ErrorInterceptor`
- `StudentService`
- `DashboardService`
- Componentes críticos: `Login`, `Students`

## E2E
### Ferramenta
- Playwright

### Rodar
```powershell
cd frontend
npx playwright install chromium
npm run e2e
```

O `playwright.config.ts` sobe backend e frontend automaticamente.

### Fluxo E2E implementado
1. Login escola
2. Criar estudante
3. Adicionar registro vacinal
4. Ver status/pendências
5. Login saúde
6. Busca ativa + dashboards
7. Exportação CSV

## Convenções de teste
- AAA (Arrange, Act, Assert)
- factories/fixtures para reduzir acoplamento
- testes deterministas e independentes

## Interpretação de falhas
- Backend:
  - erro de permissão: revisar perfil/scope por escola
  - erro de status: revisar calendário ativo e regras por idade
- Frontend:
  - erro unitário: revisar mocks e contratos HTTP
  - erro E2E: revisar disponibilidade backend/frontend e seed