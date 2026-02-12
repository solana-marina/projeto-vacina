# Arquitetura do Prototipo

## Visao geral
Arquitetura em duas camadas principais:
- API REST em Django/DRF (RBAC + segregacao por escola + motor de calendario vacinal versionado)
- SPA Angular modular com lazy loading por feature

## Backend (apps)
- `accounts`
  - usuario custom (`email` como login)
  - papeis: ADMIN, SCHOOL_OPERATOR, SCHOOL_MANAGER, HEALTH_PRO, HEALTH_MANAGER
  - JWT customizado (token retorna role/school/user)
- `core`
  - `School`, `Student`
  - endpoints de escolas e estudantes
  - acao `GET /api/students/{id}/immunization-status/`
- `immunization`
  - `Vaccine`, `VaccineScheduleVersion`, `VaccineDoseRule`, `VaccinationRecord`
  - motor de regra: pendente/atrasada por idade e calendario ativo
  - export CSV: `GET /api/exports/students-pending.csv`
  - command `seed_demo`
- `analytics_app`
  - dashboards consolidados:
    - cobertura por escola
    - ranking por atraso/sem dados
    - distribuicao de pendencias por faixa etaria
- `audit`
  - `AuditLog` para acoes criticas

## Frontend (modulos lazy)
- `features/auth`
  - login JWT
- `features/school`
  - lista de estudantes com filtros/paginacao
  - cadastro/edicao
  - detalhe (status + pendencias + registros vacinais)
  - tela de pendencias
- `features/health`
  - busca ativa nominal com filtros
  - dashboards e export CSV
- `features/admin`
  - escolas, usuarios e calendario vacinal

## Core frontend
- `core/services/auth.ts`: sessao/token
- `core/guards/auth-guard.ts`: rota autenticada
- `core/guards/role-guard.ts`: autorizacao por perfil
- `core/interceptors/jwt-interceptor.ts`: bearer token
- `core/interceptors/error-interceptor.ts`: tratamento padrao de erro
- `core/layout/main-layout`: menu por perfil

## Fluxo principal (alto nivel)
1. Usuario autentica e recebe JWT + metadados de perfil/escola.
2. Operador da escola cadastra estudante e registros vacinais.
3. Endpoint de status calcula pendencias por calendario ativo.
4. Saude usa busca ativa e dashboards consolidados.
5. Export CSV apoia operacao e relatorio.

## Segregacao e governanca
- Usuarios de escola acessam apenas sua escola.
- Saude e admin possuem visao consolidada (conforme permissao).
- Auditoria registra alteracoes criticas.
