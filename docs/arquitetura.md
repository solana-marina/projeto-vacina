# Arquitetura do Protótipo

## Visão Geral
Arquitetura em duas camadas principais:
- API REST em Django/DRF (RBAC + segregação por escola + motor de calendário vacinal versionado).
- SPA Angular modular com lazy loading por funcionalidade.

## Backend (Apps)
- `accounts`
  - usuário customizado (`email` como login)
  - perfis: ADMIN, SCHOOL_OPERATOR, SCHOOL_MANAGER, HEALTH_PRO, HEALTH_MANAGER
  - JWT customizado (token retorna role/school/user)
- `core`
  - `School`, `Student`
  - endpoints de escolas e estudantes
  - ação `GET /api/students/{id}/immunization-status/`
- `immunization`
  - `Vaccine`, `VaccineScheduleVersion`, `VaccineDoseRule`, `VaccinationRecord`
  - motor de regra: pendente/atrasada por idade e calendário ativo
  - exportação CSV: `GET /api/exports/students-pending.csv`
  - comando `seed_demo`
- `analytics_app`
  - dashboards consolidados:
    - cobertura por escola
    - ranking por atraso/sem dados
    - distribuição de pendências por faixa etária
- `audit`
  - `AuditLog` para ações críticas

## Frontend (Módulos Lazy)
- `features/auth`
  - login JWT
- `features/school`
  - lista de estudantes com filtros/paginação
  - cadastro/edição
  - detalhe (status + pendências + registros vacinais)
  - tela de pendências
- `features/health`
  - busca ativa nominal com filtros
  - dashboards e exportação CSV
- `features/admin`
  - escolas, usuários, vacinas e calendário vacinal

## Core Frontend
- `core/services/auth.ts`: sessão/token
- `core/guards/auth-guard.ts`: rota autenticada
- `core/guards/role-guard.ts`: autorização por perfil
- `core/interceptors/jwt-interceptor.ts`: bearer token
- `core/interceptors/error-interceptor.ts`: tratamento padrão de erro
- `core/layout/main-layout`: menu por perfil

## Fluxo Principal (Alto Nível)
1. Usuário autentica e recebe JWT + metadados de perfil/escola.
2. Operador da escola cadastra estudante e registros vacinais.
3. Endpoint de status calcula pendências por calendário ativo.
4. Saúde utiliza busca ativa e dashboards consolidados.
5. Exportação CSV apoia operação e relatório.

## Segregação e Governança
- Usuários de escola acessam apenas sua própria escola.
- Saúde e administração possuem visão consolidada (conforme permissão).
- Auditoria registra alterações críticas.