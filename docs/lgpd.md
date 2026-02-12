# LGPD no Projeto de Vacinação Contra o HPV (Resumo)

## Finalidade
Tratamento de dados pessoais para monitoramento da vacinação contra o HPV de estudantes e apoio à busca ativa nominal em saúde.

## Minimização de Dados
- Coleta limitada ao necessário para execução da política vacinal:
  - identificação do estudante;
  - data de nascimento;
  - vínculo escolar;
  - registros vacinais;
  - contato básico do responsável.
- Não há ingestão automatizada de bases externas neste protótipo.

## Controle de Acesso
- Autenticação por JWT.
- Controle de perfis com RBAC.
- Segregação por escola para perfis escolares.
- Acesso consolidado para saúde e administração conforme atribuição funcional.

## Rastreabilidade e Transparência
- Trilhas de autoria e tempo (`created_by`, `updated_by`, `created_at`, `updated_at`).
- `AuditLog` para alterações críticas de estudantes, registros vacinais e calendário.
- API documentada em OpenAPI/Swagger.

## Retenção (Escopo do Protótipo)
- Não há expurgo automático no ambiente de demonstração.
- Para produção, recomenda-se:
  - política formal de retenção;
  - revisão periódica de necessidade;
  - mecanismos de anonimização e exclusão quando cabíveis.

## Segurança Básica Implementada
- Token com expiração.
- Segregação de acesso por contexto escolar.
- Controle de permissões por papel.

## Recomendações para Evolução
- Comunicação obrigatória via TLS em todos os ambientes.
- Política de rotação de segredos e credenciais.
- Hardening de senha e autenticação reforçada.
- Plano de backup e recuperação com testes periódicos.
