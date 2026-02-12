# Estratégia e Cobertura de Testes

## Objetivo
Garantir confiabilidade funcional e segurança de acesso do **Projeto de Vacinação Contra o HPV**, cobrindo:
- regras de negócio (motor vacinal);
- permissões (RBAC e segregação por escola);
- contratos de API (todos os endpoints expostos);
- fluxos de interface por perfil (admin, escola, saúde).

## Pirâmide de Testes
1. **Backend integração (pytest + banco de teste)**: valida API, permissões e dados agregados.
2. **Frontend unitário (Karma/Jasmine)**: valida serviços, guards, interceptors e componentes críticos.
3. **E2E (Playwright)**: valida jornadas completas por perfil.

---

## Backend (pytest)

### Ferramentas
- `pytest`
- `pytest-django`
- `pytest-cov`
- `factory_boy`
- `Faker`

### Execução
```powershell
cd backend
pytest -q
```

### Arquivos principais da suíte
- `backend/tests/test_immunization_engine.py`
- `backend/tests/test_segmentation_permissions.py`
- `backend/tests/test_endpoints.py`
- `backend/tests/test_api_matrix.py`

### Matriz de cobertura de endpoints

| Grupo | Endpoints cobertos |
|---|---|
| Auth | `POST /api/auth/token/`, `POST /api/auth/token/refresh/` |
| Users | `GET/POST/PATCH/DELETE /api/users/` |
| Schools | `GET/POST/PATCH /api/schools/` |
| Students | `GET/POST/PATCH/DELETE /api/students/`, `GET /api/students/{id}/` |
| Status vacinal | `GET /api/students/{id}/immunization-status/` |
| Vacinação (nested) | `GET/POST /api/students/{id}/vaccinations/` |
| Vacinação (global) | `GET/PATCH/DELETE /api/vaccinations/{id}/`, `GET /api/vaccinations/` |
| Vaccines | `GET/POST/PATCH/DELETE /api/vaccines/` |
| Schedules | `GET/POST/PATCH/DELETE /api/schedules/` |
| Rules (custom) | `GET/POST /api/schedules/{id}/rules/`, `PATCH/DELETE /api/schedules/{id}/rules/{ruleId}/` |
| Rules (viewset) | `GET /api/schedule-rules/`, `GET /api/schedule-rules/{id}/` |
| Dashboards | `GET /api/dashboards/schools/coverage/`, `GET /api/dashboards/schools/ranking/`, `GET /api/dashboards/age-distribution/` |
| Export | `GET /api/exports/students-pending.csv` |

### O que é validado na prática
- autenticação JWT válida/inválida;
- autorização por perfil para cada endpoint (200/201 vs 401/403);
- segregação entre escolas (404/403 conforme escopo);
- CRUD completo de entidades administrativas;
- consistência do status vacinal e pendências;
- dashboards e export CSV;
- geração de `AuditLog` em ações críticas;
- exigência de autenticação nos endpoints protegidos.

### Cobertura
- XML: `backend/coverage.xml`
- HTML: `backend/htmlcov/index.html`

---

## Frontend Unitário

### Execução
```powershell
cd frontend
npm run test:unit
```

### Arquivos principais da suíte
- Core:
  - `frontend/src/app/core/services/auth.spec.ts`
  - `frontend/src/app/core/services/token-storage.spec.ts`
  - `frontend/src/app/core/guards/auth-guard.spec.ts`
  - `frontend/src/app/core/guards/role-guard.spec.ts`
  - `frontend/src/app/core/interceptors/jwt-interceptor.spec.ts`
  - `frontend/src/app/core/interceptors/error-interceptor.spec.ts`
  - `frontend/src/app/core/layout/home-redirect/home-redirect.spec.ts`
- Features:
  - `frontend/src/app/features/school/services/student.spec.ts`
  - `frontend/src/app/features/health/services/dashboard.spec.ts`
  - `frontend/src/app/features/admin/services/admin.spec.ts`
  - `frontend/src/app/features/auth/pages/login/login.spec.ts`
  - `frontend/src/app/features/school/pages/students/students.spec.ts`

### Escopo coberto
- serviços HTTP de escola, saúde e admin (todos os métodos/rotas do frontend);
- interceptors e guards;
- gestão de sessão e redirecionamento por perfil;
- componentes críticos de login e lista de estudantes.

---

## E2E (Playwright)

### Execução
```powershell
cd frontend
npx playwright install chromium
npm run e2e
```

`playwright.config.ts` sobe backend e frontend automaticamente para os testes.

### Cenários E2E cobertos

| Arquivo | Fluxo |
|---|---|
| `frontend/e2e/main-flow.spec.ts` | Escola (criar estudante, registrar vacina, status) + Saúde (busca ativa, dashboards, export CSV) |
| `frontend/e2e/role-flows.spec.ts` | Admin (CRUD de escola, usuário, vacina, calendário/regra), Gestor escolar (pendências), Gestor de saúde (dashboards consolidados) |

### Perfis exercitados
- `ADMIN`
- `SCHOOL_OPERATOR`
- `SCHOOL_MANAGER`
- `HEALTH_PRO`
- `HEALTH_MANAGER`

---

## Convenções de Escrita de Testes
- padrão AAA (Arrange, Act, Assert);
- factories para dados consistentes;
- asserts de status HTTP + conteúdo de resposta;
- uso de `data-testid` no frontend para reduzir fragilidade em E2E;
- isolamento: cada teste prepara os próprios dados.

## Diagnóstico Rápido de Falhas

### Backend
- **401**: token ausente/inválido.
- **403**: perfil sem permissão para o endpoint.
- **404 em escopo escolar**: tentativa de acesso a dados de outra escola.
- **Falha em status vacinal**: revisar calendário ativo e regras de dose/faixa etária.

### Frontend unitário
- falhas em serviço: divergência de rota/parâmetros HTTP;
- falhas em guards/interceptors: alteração de contrato de sessão/autorização.

### E2E
- falha de login: seed inconsistente;
- falha de navegação: rota/guard alterado;
- falha de CRUD: contrato API alterado ou permissão regressiva.
