# Projeto de Vacinação Contra o HPV

## Visão Geral
Este repositório apresenta um protótipo funcional para gestão da vacinação contra o HPV de estudantes, com operação integrada entre escolas, equipes de saúde e gestão pública.

O projeto foi estruturado para evidenciar características de uma solução de maturidade digital nível 3, com processos padronizados, uso operacional de dados nominais, governança mínima e apoio à decisão.

## Problema Público Endereçado
- Fragmentação do acompanhamento da vacinação contra o HPV por escola e território.
- Dificuldade de identificar estudantes com atraso, incompletude ou ausência de dados vacinais.
- Baixa capacidade de busca ativa nominal orientada por critérios objetivos.
- Falta de rastreabilidade de alterações críticas em calendário e registros vacinais.

## Escopo Funcional Entregue
### Operação Escolar
- Cadastro e manutenção de estudantes.
- Registro nominal de doses aplicadas (sem importação de planilhas).
- Cálculo automático de situação vacinal por idade e regras do calendário ativo.
- Acompanhamento de pendências e atrasos por estudante.

### Operação da Saúde
- Busca ativa nominal com filtros por nome, escola, faixa etária e status.
- Dashboards consolidados de cobertura e atraso.
- Exportação CSV para organização de ações de campo.

### Administração
- CRUD de escolas.
- CRUD de usuários e perfis.
- CRUD de vacinas.
- Gestão de versões do calendário vacinal.
- Gestão de regras por dose e faixa etária.

## Perfis e Escopos de Acesso (RBAC)
| Perfil | Escopo de acesso | Principais permissões |
|---|---|---|
| ADMIN | Global | Gerencia usuários, escolas, vacinas, calendário e visão total do sistema |
| SCHOOL_OPERATOR | Apenas a própria escola | CRUD de estudantes e registros vacinais da escola vinculada |
| SCHOOL_MANAGER | Apenas a própria escola | Mesmo escopo do operador, com visão gerencial escolar |
| HEALTH_PRO | Multiescola | Leitura consolidada, busca ativa, dashboards e exportação |
| HEALTH_MANAGER | Multiescola | Mesmo escopo da saúde, com visão gerencial ampliada |

Segregação implementada:
- Usuários escolares não acessam dados de outras escolas.
- Perfis de saúde e administração acessam dados consolidados conforme permissão.

## Fluxos por Perfil
### ADMIN
1. Cadastra escolas e usuários.
2. Mantém catálogo de vacinas.
3. Cria e ativa versão de calendário vacinal HPV.
4. Define regras por vacina, dose e faixa etária.
5. Monitora consolidados para gestão.

### SCHOOL_OPERATOR
1. Cadastra estudante da própria escola.
2. Registra doses aplicadas.
3. Consulta situação vacinal e pendências.
4. Atua nos casos atrasados e sem dados.

### SCHOOL_MANAGER
1. Executa o fluxo escolar completo.
2. Prioriza estudantes em atraso para ação interna.

### HEALTH_PRO
1. Executa busca ativa nominal.
2. Analisa dashboards de cobertura e atraso.
3. Exporta CSV para planejamento operacional.

### HEALTH_MANAGER
1. Executa as mesmas ações do HEALTH_PRO.
2. Consolida indicadores para priorização territorial.

## Enquadramento em Maturidade Digital Nível 3
| Critério típico de nível 3 | Evidência no sistema |
|---|---|
| Processos críticos digitalizados e operacionais | Registro nominal de estudantes e vacinação diretamente no sistema |
| Regras padronizadas e aplicadas de forma consistente | Calendário vacinal versionado com regras por dose/faixa etária |
| Uso de dados para gestão e decisão | Dashboards de cobertura, atraso e distribuição de pendências |
| Governança mínima de acesso e rastreabilidade | JWT, RBAC, segregação por escola e trilha de auditoria |
| Capacidade de execução orientada por dados | Busca ativa nominal e exportação CSV para operação |

## Segurança e Governança
### Segurança de Acesso
- Autenticação por JWT.
- Controle de autorização por perfil (RBAC).
- Segregação por escola para perfis escolares.

### Governança e Auditoria
- Campos de rastreabilidade: `created_by`, `updated_by`, `created_at`, `updated_at`.
- `AuditLog` para eventos críticos (estudantes, registros vacinais, calendário).
- Documentação OpenAPI/Swagger para transparência técnica.

### Privacidade e LGPD (escopo protótipo)
- Coleta orientada à minimização de dados para finalidade de vacinação contra o HPV.
- Acesso restrito por necessidade de uso (perfil + vínculo de escola).
- Diretrizes resumidas em `docs/lgpd.md`.

## Arquitetura Resumida
- Backend: Python, Django, DRF, SimpleJWT, PostgreSQL.
- Frontend: Angular modular com lazy loading, guards e interceptors.
- Infra: Docker Compose para banco PostgreSQL.
- Seed de demonstração com perfis, escolas, estudantes, vacinas e calendário.

## Qualidade Técnica
- Backend com testes automatizados e cobertura.
- Frontend com testes unitários.
- E2E cobrindo fluxo principal de ponta a ponta.
- Estratégia e execução em `docs/testing.md`.

## Documentação
- `docs/arquitetura.md`: módulos, componentes e fluxos.
- `docs/api.md`: autenticação e endpoints.
- `docs/lgpd.md`: finalidade, minimização e controles.
- `docs/testing.md`: estratégia e execução de testes.

## Credenciais de Demonstração
- ADMIN: `admin@vacina.local / Admin@123`
- SCHOOL_OPERATOR: `operador.escola@vacina.local / Escola@123`
- SCHOOL_MANAGER: `gestor.escola@vacina.local / Escola@123`
- HEALTH_PRO: `saude@vacina.local / Saude@123`
- HEALTH_MANAGER: `gestor.saude@vacina.local / Saude@123`

## Backlog Estratégico (fora do escopo atual)
- Integrações externas (e-SUS e afins).
- Notificações avançadas (SMS, WhatsApp, push).
- Observabilidade avançada (tracing, métricas e alertas).
- Importação de planilhas/CSV.
