# Arquitetura do Projeto de Vacinação Contra o HPV

## Visão Geral
A solução é composta por:
- Backend em Django + DRF (API REST).
- Frontend web em React (Vite), modularizado por domínio.
- Persistência em PostgreSQL.

O desenho prioriza maturidade digital nível 3: processos padronizados, operação orientada a dados e governança mínima.

## Backend
### Apps
- `accounts`: usuário customizado, autenticação JWT, perfis e permissões.
- `core`: escolas e estudantes.
- `immunization`: vacinas, calendário, regras, registros vacinais e motor de status.
- `analytics_app`: dashboards e preferências de faixas etárias por usuário.
- `audit`: auditoria de ações críticas e logs de erro.

### Regras de domínio
- Perfis finais: `ADMIN`, `ESCOLA`, `SAUDE`.
- Estudante sem `turma`; com campo `sex` (`F`, `M`, `NI` legado).
- Novos cadastros exigem `F` ou `M`.
- Sempre deve existir um calendário ativo.
- Regra de dose única por (`schedule_version`, `vaccine`, `dose_number`).

### Segurança e governança
- JWT para autenticação.
- RBAC por perfil.
- Segregação por escola para perfil `ESCOLA`.
- `AuditLog` para trilha de ações críticas.
- `ErrorLog` para erros operacionais com `trace_id`.

## Frontend
### Estrutura
- `src-react/context`: sessão/autenticação.
- `src-react/components`: layout, rotas protegidas e UI base.
- `src-react/features/auth`: login.
- `src-react/features/school`: estudantes, detalhe vacinal e pendências.
- `src-react/features/health`: busca ativa e dashboards.
- `src-react/features/admin`: escolas, usuários, calendário, monitoramento.
- `legacy/frontend-angular/`: frontend Angular legado (fora da execução atual).

### Navegação por perfil
- `ADMIN`: estudantes, escolas, usuários, calendário, dashboards, auditoria/logs.
- `ESCOLA`: estudantes e pendências da própria escola.
- `SAUDE`: busca ativa e dashboards consolidados.

## Fluxos principais
1. Usuário autentica e recebe token JWT com perfil e vínculo.
2. Escola registra estudante e histórico vacinal.
3. Backend calcula status vacinal pelo calendário ativo.
4. Saúde filtra população nominal e prioriza pendências.
5. Administração acompanha indicadores, auditoria e falhas.

## Observações arquiteturais
- Backend mantém idade em meses para regras e cálculo.
- Frontend apresenta idade em anos + meses para melhor usabilidade.
- Faixas etárias de dashboard são persistidas por usuário.
