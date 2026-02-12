# Arquitetura do Projeto de Vacinação Contra o HPV

## Visão de Arquitetura
Solução web em duas camadas:
- API REST em Django/DRF com autenticação JWT, RBAC e segregação por escola.
- SPA Angular modular com lazy loading por perfil funcional.

O desenho prioriza operação real de nível 3: processos digitalizados, regras padronizadas, dados consolidados e governança mínima.

## Backend (Django)
### App `accounts`
- Usuário customizado (`email` como login).
- Perfis: `ADMIN`, `SCHOOL_OPERATOR`, `SCHOOL_MANAGER`, `HEALTH_PRO`, `HEALTH_MANAGER`.
- Emissão de JWT com metadados de perfil e escola.

### App `core`
- Entidades: `School`, `Student`.
- Endpoints de escolas e estudantes.
- Ação de status vacinal: `GET /api/students/{id}/immunization-status/`.

### App `immunization`
- Entidades: `Vaccine`, `VaccineScheduleVersion`, `VaccineDoseRule`, `VaccinationRecord`.
- Motor de regras por dose/faixa etária (idade em meses).
- Exportação CSV de pendências: `GET /api/exports/students-pending.csv`.
- Comando de demonstração: `python manage.py seed_demo`.

### App `analytics_app`
- Dashboards consolidados:
  - cobertura por escola;
  - ranking de atraso/sem dados;
  - distribuição de pendências por faixa etária.

### App `audit`
- Entidade `AuditLog` para trilha de eventos críticos.

## Frontend (Angular)
### Módulos lazy por feature
- `features/auth`: login.
- `features/school`: estudantes, detalhe vacinal e pendências.
- `features/health`: busca ativa nominal, dashboards e exportação.
- `features/admin`: escolas, usuários, vacinas e calendário vacinal HPV.

### Núcleo de segurança e sessão
- `core/services/auth.ts`: sessão e token.
- `core/guards/auth-guard.ts`: proteção por autenticação.
- `core/guards/role-guard.ts`: autorização por perfil.
- `core/interceptors/jwt-interceptor.ts`: anexo do token Bearer.
- `core/interceptors/error-interceptor.ts`: tratamento uniforme de erros.

## Fluxo Principal (Ponta a Ponta)
1. Usuário autentica e recebe token JWT com perfil/escola.
2. Escola registra estudantes e doses aplicadas.
3. API calcula situação vacinal com base no calendário ativo.
4. Saúde executa busca ativa com filtros nominais.
5. Gestão usa dashboards e exportações para priorização de ação.

## Segregação e Governança
- Perfis escolares enxergam apenas a própria escola.
- Perfis de saúde e administração possuem visão consolidada conforme RBAC.
- Alterações críticas geram trilha de auditoria.

## Foco Funcional em HPV
- Interface, fluxos e documentação orientados para monitoramento da vacinação contra o HPV.
- Catálogo e regras permitem expansão, mas a demonstração institucional é centrada no HPV.
