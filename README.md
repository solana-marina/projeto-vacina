# Sistema Web de Carteira de Vacinacao Escolar (Prototipo Nivel 3)

Prototipo funcional para gestao de carteira de vacinacao de estudantes, com operacao por escolas, equipe de saude e administracao.

## Stack
- Backend: Python 3.11+, Django, DRF, JWT (SimpleJWT), drf-spectacular, pytest
- Frontend: Angular 20, Angular Material, lazy loading por feature
- Banco: PostgreSQL via Docker Compose
- E2E: Playwright

## Estrutura do repositorio
- `backend/`: API Django + regras de imunizacao + seed + testes
- `frontend/`: SPA Angular modular
- `docs/`: arquitetura, API, LGPD e testes
- `docker-compose.yml`: Postgres + pgAdmin

## 1) Subir banco (Postgres)
Com Docker Desktop/Engine em execucao:
```bash
docker compose up -d postgres
```
Opcional (admin visual):
```bash
docker compose up -d pgadmin
```

## 2) Backend
No Windows PowerShell:
```powershell
cd backend
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt

$env:POSTGRES_DB='vacina'
$env:POSTGRES_USER='vacina'
$env:POSTGRES_PASSWORD='vacina'
$env:POSTGRES_HOST='localhost'
$env:POSTGRES_PORT='5432'

python manage.py migrate
python manage.py seed_demo --reset
python manage.py runserver 8000
```

Swagger/OpenAPI:
- `http://localhost:8000/api/docs/`
- `http://localhost:8000/api/schema/`

## 3) Frontend
```powershell
cd frontend
npm install
npm start
```
Aplicacao: `http://localhost:4200`

## 4) Credenciais de demo
- `admin@vacina.local / Admin@123`
- `operador.escola@vacina.local / Escola@123`
- `gestor.escola@vacina.local / Escola@123`
- `saude@vacina.local / Saude@123`
- `gestor.saude@vacina.local / Saude@123`

## 5) Rodar testes
### Backend
```powershell
cd backend
pytest -q
```
Saidas de cobertura:
- `backend/coverage.xml`
- `backend/htmlcov/index.html`

### Frontend unit
```powershell
cd frontend
npm run test:unit
```

### E2E
```powershell
cd frontend
npx playwright install chromium
npm run e2e
```
O Playwright sobe frontend e backend automaticamente para o fluxo principal.

## 6) Fluxos entregues
- Login JWT com perfis (ADMIN, SCHOOL_OPERATOR, SCHOOL_MANAGER, HEALTH_PRO, HEALTH_MANAGER)
- Escola:
  - lista/cadastro/edicao de estudantes
  - detalhe do estudante com status vacinal e pendencias
  - CRUD de registros vacinais
  - tela de pendencias
- Saude:
  - busca ativa nominal com filtros
  - dashboards (cobertura, ranking, distribuicao por faixa etaria)
  - exportacao CSV de pendentes
- Admin:
  - CRUD de escolas
  - CRUD de usuarios
  - criacao/ativacao de versao de calendario
  - cadastro de regras por vacina/dose/faixa etaria

## 7) Itens fora do escopo (backlog)
- Integracoes externas (e-SUS e afins)
- Notificacoes avancadas (WhatsApp/SMS)
- Observabilidade avancada (tracing/metrics completos)
- Importacao de planilhas/CSV

## 8) Referencias adicionais
- `docs/arquitetura.md`
- `docs/api.md`
- `docs/lgpd.md`
- `docs/testing.md`
