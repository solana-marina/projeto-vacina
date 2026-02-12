# LGPD (versao simplificada para prototipo)

## Finalidade
Tratamento de dados para monitoramento da situacao vacinal de estudantes e apoio a acoes de busca ativa da saude.

## Base e minimizacao
- Coleta restrita ao necessario para o fluxo operacional:
  - identificacao do estudante
  - data de nascimento
  - vinculo escola
  - registros vacinais
  - contato basico do responsavel
- Sem ingestao de dados externos automatizada neste prototipo.

## Controle de acesso
- Autenticacao por JWT.
- RBAC por perfil.
- Segregacao por escola para perfis escolares.
- Perfis de saude e admin com acesso conforme atribuicao.

## Transparencia e rastreabilidade
- Campos de trilha (`created_at`, `updated_at`, `created_by`, `updated_by` em entidades principais).
- `AuditLog` para acoes criticas (estudante, registro vacinal, calendario).

## Retencao (simplificada)
- Prototipo: sem politica automatica de expurgo.
- Producao recomendada:
  - politica de retencao por normativa local
  - revisao periodica de necessidade
  - trilha de exclusao e anonimização quando cabivel

## Seguranca basica
- Token com expiração.
- Recomendado para producao:
  - TLS
  - hardening de senha/politicas
  - rotacao de segredos
  - backups e controle de acesso ao banco
