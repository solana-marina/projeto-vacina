# Testing

## Estrategia
Piramide aplicada:
1. Unitarios (maior base)
2. Integracao API (pytest + banco de teste)
3. E2E (Playwright) cobrindo fluxo principal

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

### Casos obrigatorios cobertos
- Motor de regras de imunizacao (EM_DIA, ATRASADO, INCOMPLETO, SEM_DADOS)
- Segregacao entre escolas
- Endpoints criticos:
  - `immunization-status`
  - dashboards
  - permissoes de acesso

### Cobertura backend
- XML: `backend/coverage.xml`
- HTML: `backend/htmlcov/index.html`

## Frontend unit
### Ferramentas
- Angular TestBed + Karma/Jasmine

### Rodar
```powershell
cd frontend
npm run test:unit
```

### Escopo unitario coberto
- `AuthService`
- `TokenStorageService`
- `AuthGuard`
- `RoleGuard`
- `JwtInterceptor`
- `ErrorInterceptor`
- `StudentService`
- `DashboardService`
- componentes criticos: `Login`, `Students`

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

### Fluxo e2e implementado
1. Login escola
2. Criar estudante
3. Adicionar registro vacinal
4. Ver status/pendencias
5. Login saude
6. Busca ativa + dashboards
7. Export CSV

## Convencoes de teste
- AAA (Arrange, Act, Assert)
- factories/fixtures para reduzir acoplamento
- testes deterministas e independentes

## Interpretacao de falhas
- Backend:
  - erro de permissao: revisar papel/scope por escola
  - erro de status: revisar calendario ativo e regras por idade
- Frontend:
  - erro unitario: revisar mocks e contratos HTTP
  - erro e2e: revisar disponibilidade backend/frontend e seed
