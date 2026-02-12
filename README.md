# Sistema Web de Carteira de Vacinação Escolar

## Visão do Projeto
Este repositório contém um protótipo funcional de sistema web para gestão da carteira de vacinação de estudantes, com foco na operação integrada entre escolas, equipes de saúde e administração pública.

Objetivo institucional: disponibilizar uma ferramenta aderente ao patamar de maturidade digital nível 3, com vistas à submissão em edital do CNPq, apresentando evidências de governança mínima, segurança, uso operacional e apoio à tomada de decisão.

## Problema que o Projeto Enfrenta
- Dificuldade de consolidar a situação vacinal de estudantes por escola e território.
- Baixa rastreabilidade de pendências vacinais e da busca ativa nominal.
- Ausência de padronização de regras de calendário vacinal por versão.
- Dependência de processos manuais e baixa visibilidade para gestores e decisores.

## Escopo Funcional Entregue
### Operação Escolar
- Cadastro e manutenção de estudantes.
- Registro nominal de vacinação (sem importação de planilhas).
- Cálculo automático da situação vacinal por idade e regras do calendário.
- Visualização de pendências e atrasos.

### Operação da Saúde
- Busca ativa nominal com filtros por nome, escola, faixa etária e status.
- Dashboards consolidados:
  - cobertura por escola;
  - ranking por atraso e ausência de dados;
  - distribuição por faixa etária.
- Exportação CSV para apoio operacional.

### Administração
- CRUD de escolas.
- CRUD de usuários e perfis.
- CRUD de vacinas.
- Gestão de versões do calendário vacinal.
- Gestão de regras por dose e faixa etária.

## Perfis e Diferenças de Acesso (RBAC)
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

## Fluxos Operacionais por Perfil
### 1. Fluxo ADMIN
1. Autentica-se no sistema.
2. Cadastra e atualiza escolas.
3. Cadastra e atualiza usuários e perfis.
4. Cadastra vacinas no catálogo.
5. Cria versão de calendário e ativa a versão vigente.
6. Cadastra regras por vacina, dose e faixa etária.
7. Monitora adesão por dashboards e exportações.

### 2. Fluxo SCHOOL_OPERATOR
1. Autentica-se no sistema.
2. Cadastra estudante da própria escola.
3. Registra doses aplicadas.
4. Consulta status vacinal do estudante.
5. Atua na lista de pendências (pendente/atrasada).

### 3. Fluxo SCHOOL_MANAGER
1. Executa os mesmos passos do operador escolar.
2. Acompanha a carteira vacinal da escola com foco gerencial.
3. Prioriza estudantes com atraso e ausência de dados para ação interna.

### 4. Fluxo HEALTH_PRO
1. Autentica-se no sistema.
2. Executa busca ativa nominal com filtros territoriais.
3. Analisa dashboards de cobertura e atraso.
4. Exporta CSV de pendências para operação de campo.

### 5. Fluxo HEALTH_MANAGER
1. Executa os mesmos passos do profissional de saúde.
2. Usa os consolidados para priorização territorial e acompanhamento de resultados.

## Arquitetura da Solução
### Backend
- Python 3.11+, Django, DRF e SimpleJWT.
- Apps: `accounts`, `core`, `immunization`, `analytics_app`, `audit`.
- OpenAPI: drf-spectacular.

### Frontend
- Angular 20 modular, com lazy loading por feature.
- Guards por autenticação e perfil.
- Interceptors para JWT e tratamento padronizado de erro.

### Dados e Infraestrutura
- PostgreSQL em Docker Compose.
- Seed de demonstração com usuários, escolas, estudantes, vacinas e calendário.

## Enquadramento em Maturidade Digital Nível 3

| Critério de nível 3 | Evidência no sistema |
|---|---|
| Uso operacional ativo nas unidades | Escola registra estudantes e vacinas diretamente no sistema |
| Processos e regras estruturadas | Calendário vacinal versionado com regras por dose/faixa etária |
| Apoio à decisão com dados | Dashboards de cobertura, ranking de atraso e distribuição etária |
| Gestão nominal da população-alvo | Busca ativa nominal e filtros multiescola |
| Governança mínima implementada | RBAC, segregação por escola e trilha de auditoria |
| Capacidade de ação operacional | Exportação CSV de pendências para rotina de campo |

### Diferença para Níveis Superiores (4 e 5)
Para evolução futura (nível 4+), recomendam-se:
- maior integração externa (ex.: e-SUS e demais sistemas oficiais);
- maior padronização e interoperabilidade em larga escala;
- observabilidade avançada e governança ampliada de dados;
- automação mais extensa de fluxos e monitoramento em tempo real.

## Segurança, Governança e Conformidade
### Segurança de Acesso
- Autenticação por JWT.
- Controle de autorização por perfil (RBAC).
- Segregação por escola para perfis escolares.

### Governança de Dados
- Rastreabilidade de alterações com `created_by`, `updated_by`, `created_at`, `updated_at`.
- `AuditLog` para eventos críticos (estudante, registro vacinal e calendário).
- API documentada (OpenAPI/Swagger), favorecendo transparência técnica.

### Privacidade e LGPD (escopo do protótipo)
- Coleta orientada à minimização de dados para a finalidade vacinal.
- Controle de acesso por necessidade de uso (perfil e escola).
- Diretrizes resumidas em `docs/lgpd.md`.

## Qualidade e Evidências Técnicas
- Suíte de testes automatizados:
  - backend (pytest + cobertura);
  - frontend unitário;
  - e2e (fluxo principal).
- Casos críticos cobertos:
  - motor de regras de imunização;
  - permissões e segregação entre escolas;
  - dashboards e exportação.

## Documentação do Repositório
- `docs/arquitetura.md`: arquitetura, módulos e fluxos de alto nível.
- `docs/api.md`: autenticação e contratos dos endpoints.
- `docs/lgpd.md`: princípios de privacidade, minimização e controle de acesso.
- `docs/testing.md`: estratégia, padrões e execução de testes.

## Credenciais de Demonstração
- ADMIN: `admin@vacina.local / Admin@123`
- SCHOOL_OPERATOR: `operador.escola@vacina.local / Escola@123`
- SCHOOL_MANAGER: `gestor.escola@vacina.local / Escola@123`
- HEALTH_PRO: `saude@vacina.local / Saude@123`
- HEALTH_MANAGER: `gestor.saude@vacina.local / Saude@123`

## Backlog Estratégico (fora do escopo atual)
- Integrações externas (e-SUS e afins).
- Notificações avançadas (SMS, WhatsApp, push).
- Observabilidade completa (tracing e métricas avançadas).
- Importação de planilhas/CSV.