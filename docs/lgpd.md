# LGPD (Versão Simplificada para Protótipo)

## Finalidade
Tratamento de dados para monitoramento da situação vacinal de estudantes e apoio a ações de busca ativa em saúde.

## Base e minimização
- Coleta restrita ao necessário para o fluxo operacional:
  - identificação do estudante
  - data de nascimento
  - vínculo escolar
  - registros vacinais
  - contato básico do responsável
- Sem ingestão automatizada de dados externos neste protótipo.

## Controle de acesso
- Autenticação por JWT.
- RBAC por perfil.
- Segregação por escola para perfis escolares.
- Perfis de saúde e administração com acesso conforme atribuição.

## Transparência e rastreabilidade
- Campos de trilha (`created_at`, `updated_at`, `created_by`, `updated_by` em entidades principais).
- `AuditLog` para ações críticas (estudante, registro vacinal e calendário).

## Retenção (simplificada)
- Protótipo: sem política automática de expurgo.
- Produção recomendada:
  - política de retenção conforme normativa local;
  - revisão periódica de necessidade;
  - trilha de exclusão e anonimização, quando cabível.

## Segurança básica
- Token com expiração.
- Recomendado para produção:
  - TLS
  - hardening de senha/políticas
  - rotação de segredos
  - backups e controle de acesso ao banco