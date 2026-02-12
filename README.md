# Sistema Web de Carteira de Vacina��o Escolar

## Vis�o do projeto
Este reposit�rio cont�m um prot�tipo funcional de sistema web para gest�o da carteira de vacina��o de estudantes, com foco na opera��o integrada entre escolas, equipes de sa�de e administra��o p�blica.

Objetivo institucional: disponibilizar uma ferramenta aderente ao patamar de maturidade digital n�vel 3, com vistas � submiss�o em edital do CNPq, apresentando evid�ncias de governan�a m�nima, seguran�a, uso operacional e apoio � tomada de decis�o.

## Problema que o projeto enfrenta
- Dificuldade de consolidar a situa��o vacinal de estudantes por escola e territ�rio.
- Baixa rastreabilidade de pend�ncias vacinais e da busca ativa nominal.
- Aus�ncia de padroniza��o de regras de calend�rio vacinal por vers�o.
- Depend�ncia de processos manuais e baixa visibilidade para gestores e decisores.

## Escopo funcional entregue
### Opera��o escolar
- Cadastro e manuten��o de estudantes.
- Registro nominal de vacina��o (sem importa��o de planilhas).
- C�lculo autom�tico da situa��o vacinal por idade e regras do calend�rio.
- Visualiza��o de pend�ncias e atrasos.

### Opera��o da sa�de
- Busca ativa nominal com filtros por nome, escola, faixa et�ria e status.
- Dashboards consolidados:
  - cobertura por escola;
  - ranking por atraso e aus�ncia de dados;
  - distribui��o por faixa et�ria.
- Exporta��o CSV para apoio operacional.

### Administra��o
- CRUD de escolas.
- CRUD de usu�rios e perfis.
- CRUD de vacinas.
- Gest�o de vers�es do calend�rio vacinal.
- Gest�o de regras por dose e faixa et�ria.

## Perfis e diferen�as de acesso (RBAC)
| Perfil | Escopo de acesso | Principais permiss�es |
|---|---|---|
| ADMIN | Global | Gerencia usu�rios, escolas, vacinas, calend�rio e vis�o total do sistema |
| SCHOOL_OPERATOR | Apenas a pr�pria escola | CRUD de estudantes e registros vacinais da escola vinculada |
| SCHOOL_MANAGER | Apenas a pr�pria escola | Mesmo escopo do operador, com vis�o gerencial escolar |
| HEALTH_PRO | Multiescola | Leitura consolidada, busca ativa, dashboards e exporta��o |
| HEALTH_MANAGER | Multiescola | Mesmo escopo da sa�de, com vis�o gerencial ampliada |

Segrega��o implementada:
- Usu�rios escolares n�o acessam dados de outras escolas.
- Perfis de sa�de e administra��o acessam dados consolidados conforme permiss�o.

## Fluxos operacionais por perfil
### 1. Fluxo ADMIN
1. Autentica-se no sistema.
2. Cadastra e atualiza escolas.
3. Cadastra e atualiza usu�rios e perfis.
4. Cadastra vacinas no cat�logo.
5. Cria vers�o de calend�rio e ativa a vers�o vigente.
6. Cadastra regras por vacina, dose e faixa et�ria.
7. Monitora ades�o por dashboards e exporta��es.

### 2. Fluxo SCHOOL_OPERATOR
1. Autentica-se no sistema.
2. Cadastra estudante da pr�pria escola.
3. Registra doses aplicadas.
4. Consulta status vacinal do estudante.
5. Atua na lista de pend�ncias (pendente/atrasada).

### 3. Fluxo SCHOOL_MANAGER
1. Executa os mesmos passos do operador escolar.
2. Acompanha a carteira vacinal da escola com foco gerencial.
3. Prioriza estudantes com atraso e aus�ncia de dados para a��o interna.

### 4. Fluxo HEALTH_PRO
1. Autentica-se no sistema.
2. Executa busca ativa nominal com filtros territoriais.
3. Analisa dashboards de cobertura e atraso.
4. Exporta CSV de pend�ncias para opera��o de campo.

### 5. Fluxo HEALTH_MANAGER
1. Executa os mesmos passos do profissional de sa�de.
2. Usa os consolidados para prioriza��o territorial e acompanhamento de resultados.

## Arquitetura da solu��o
### Backend
- Python 3.11+, Django, DRF e SimpleJWT.
- Apps: `accounts`, `core`, `immunization`, `analytics_app`, `audit`.
- OpenAPI: drf-spectacular.

### Frontend
- Angular 20 modular, com lazy loading por feature.
- Guards por autentica��o e perfil.
- Interceptors para JWT e tratamento padronizado de erro.

### Dados e infraestrutura
- PostgreSQL em Docker Compose.
- Seed de demonstra��o com usu�rios, escolas, estudantes, vacinas e calend�rio.

## Enquadramento em maturidade digital n�vel 3
### Refer�ncia adotada
Para caracteriza��o de maturidade digital em sa�de, foi adotado como refer�ncia o framework de fases (1 a 5) do Global Digital Health Monitor (GDHM), atualmente hospedado no portal de dados da OMS.

### Leitura t�cnica utilizada para n�vel 3
Com base nas defini��es de fase publicadas no GDHM (por indicador), o n�vel 3 representa um estado em que:
- pol�ticas e processos j� existem e foram formalizados, mas ainda sem implementa��o plena em todo o sistema;
- servi�os digitais est�o em uso operacional ativo nas unidades;
- sistemas j� contribuem para monitoramento e tomada de decis�o em sa�de p�blica;
- a cobertura ainda � parcial e requer expans�o para n�veis superiores.

Observa��o metodol�gica: esta s�ntese � uma infer�ncia t�cnica a partir das descri��es de fase por indicador no GDHM/OMS.

### Mapeamento do sistema para n�vel 3
| Crit�rio de n�vel 3 (infer�ncia GDHM) | Evid�ncia no sistema |
|---|---|
| Uso operacional ativo nas unidades | Escola registra estudantes e vacinas diretamente no sistema |
| Processos e regras estruturadas | Calend�rio vacinal versionado com regras por dose/faixa et�ria |
| Apoio � decis�o com dados | Dashboards de cobertura, ranking de atraso e distribui��o et�ria |
| Gest�o nominal da popula��o-alvo | Busca ativa nominal e filtros multiescola |
| Governan�a m�nima implementada | RBAC, segrega��o por escola e trilha de auditoria |
| Capacidade de a��o operacional | Exporta��o CSV de pend�ncias para rotina de campo |

### Diferen�a para n�veis superiores (4 e 5)
Para evolu��o futura (n�vel 4+), recomendam-se:
- maior integra��o externa (ex.: e-SUS e demais sistemas oficiais);
- maior padroniza��o e interoperabilidade em larga escala;
- observabilidade avan�ada e governan�a ampliada de dados;
- automa��o mais extensa de fluxos e monitoramento em tempo real.

## Seguran�a, governan�a e conformidade
### Seguran�a de acesso
- Autentica��o por JWT.
- Controle de autoriza��o por perfil (RBAC).
- Segrega��o por escola para perfis escolares.

### Governan�a de dados
- Rastreabilidade de altera��es com `created_by`, `updated_by`, `created_at`, `updated_at`.
- `AuditLog` para eventos cr�ticos (estudante, registro vacinal e calend�rio).
- API documentada (OpenAPI/Swagger), favorecendo transpar�ncia t�cnica.

### Privacidade e LGPD (escopo do prot�tipo)
- Coleta orientada � minimiza��o de dados para a finalidade vacinal.
- Controle de acesso por necessidade de uso (perfil e escola).
- Diretrizes resumidas em `docs/lgpd.md`.

## Qualidade e evid�ncias t�cnicas
- Su�te de testes automatizados:
  - backend (pytest + cobertura);
  - frontend unit�rio;
  - e2e (fluxo principal).
- Casos cr�ticos cobertos:
  - motor de regras de imuniza��o;
  - permiss�es e segrega��o entre escolas;
  - dashboards e exporta��o.

## Documenta��o do reposit�rio
- `docs/arquitetura.md`: arquitetura, m�dulos e fluxos de alto n�vel.
- `docs/api.md`: autentica��o e contratos dos endpoints.
- `docs/lgpd.md`: princ�pios de privacidade, minimiza��o e controle de acesso.
- `docs/testing.md`: estrat�gia, padr�es e execu��o de testes.

## Credenciais de demonstra��o
- ADMIN: `admin@vacina.local / Admin@123`
- SCHOOL_OPERATOR: `operador.escola@vacina.local / Escola@123`
- SCHOOL_MANAGER: `gestor.escola@vacina.local / Escola@123`
- HEALTH_PRO: `saude@vacina.local / Saude@123`
- HEALTH_MANAGER: `gestor.saude@vacina.local / Saude@123`

## Backlog estrat�gico (fora do escopo atual)
- Integra��es externas (e-SUS e afins).
- Notifica��es avan�adas (SMS, WhatsApp, push).
- Observabilidade completa (tracing e m�tricas avan�adas).
- Importa��o de planilhas/CSV.

## Refer�ncias externas para enquadramento
- OMS - Global Digital Health Monitor (overview): https://data.who.int/dashboards/gdhm/overview
- OMS - GDHM countries/data (defini��es de fase por indicador): https://data.who.int/dashboards/gdhm/countries?m49=004&year=2023
- State of Digital Health 2023 (GDHM): https://static1.squarespace.com/static/5ace2d0c5cfd792078a05e5f/t/656f97969301e337ada15270/1701812128734/State%2Bof%2BDigital%2BHealth_2023.pdf
- State of Digital Health 2019 (GDHI): https://static1.squarespace.com/static/5ace2d0c5cfd792078a05e5f/t/5d4dcb80a9b3640001183a34/1565379490219/State%2Bof%2BDigital%2BHealth%2B2019.pdf