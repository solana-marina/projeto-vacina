# LGPD e Privacidade (escopo do protótipo)

## Finalidade
O tratamento de dados pessoais é realizado para gestão da vacinação contra o HPV em estudantes, incluindo:
- registro vacinal nominal;
- identificação de pendências e atrasos;
- apoio à busca ativa e planejamento operacional.

## Minimização de dados
O sistema coleta apenas dados necessários para a finalidade sanitária e educacional:
- identificação do estudante e data de nascimento;
- sexo (`F`/`M`, com `NI` apenas para legado);
- responsável e contato;
- histórico vacinal por dose.

## Controle de acesso
- Autenticação por JWT.
- Autorização por perfil (`ADMIN`, `ESCOLA`, `SAUDE`).
- Segregação por escola para usuários do perfil `ESCOLA`.

## Rastreabilidade e responsabilização
- Campos de autoria (`created_by`, `updated_by`).
- `AuditLog` para alterações críticas.
- `ErrorLog` com `trace_id` para investigação técnica.

## Retenção e descarte (diretriz simplificada)
- Dados devem ser mantidos conforme política institucional e base legal aplicável.
- O protótipo não implementa, nesta versão, automação de descarte/anonimização por prazo.

## Direitos do titular
A operacionalização de direitos do titular deve ser conduzida pela instituição controladora, com fluxo formal de atendimento e registro.

## Limites do protótipo
- Não inclui integração com sistemas externos oficiais.
- Não inclui módulo completo de consentimento, portal do titular ou DLP.
- Não substitui avaliação jurídica formal de conformidade.
