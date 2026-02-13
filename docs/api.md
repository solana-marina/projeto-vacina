# API do Projeto de Vacinação Contra o HPV

## Autenticação
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`

### Exemplo
```json
{
  "email": "admin@vacina.local",
  "password": "Admin@123"
}
```

Resposta inclui `access`, `refresh`, `role`, `school_id`, `full_name`.

## Documentação OpenAPI
- Swagger: `/api/docs/`
- Schema: `/api/schema/`

## Recursos principais
### Administração
- `GET/POST/PATCH/DELETE /api/users/`
- `GET/POST/PATCH/DELETE /api/schools/`
- `GET/POST/PATCH/DELETE /api/vaccines/`
- `GET/POST/PATCH/DELETE /api/schedules/`
- `GET/POST /api/schedules/{id}/rules/`
- `PATCH/DELETE /api/schedules/{id}/rules/{ruleId}/`

### Estudantes e vacinação
- `GET/POST /api/students/`
- `GET/PATCH/DELETE /api/students/{id}/`
- `GET /api/students/{id}/immunization-status/`
- `GET/POST /api/students/{id}/vaccinations/`
- `PATCH/DELETE /api/vaccinations/{id}/`

Filtros suportados em estudantes:
- `q`, `schoolId`, `status`, `ageMin`, `ageMax`, `sex`, `page`

### Dashboards
- `GET /api/dashboards/schools/coverage/`
- `GET /api/dashboards/schools/ranking/`
- `GET /api/dashboards/age-distribution/`

Filtros suportados:
- `q`, `schoolId`, `status`, `ageMin`, `ageMax`, `sex`

### Preferências de dashboard
- `GET /api/dashboards/preferences/age-buckets/`
- `PUT /api/dashboards/preferences/age-buckets/`

Payload de `PUT`:
```json
{
  "ageBuckets": [
    { "label": "0-11", "minMonths": 0, "maxMonths": 11 },
    { "label": "12+", "minMonths": 12, "maxMonths": 999 }
  ]
}
```

### Governança e monitoramento
- `GET /api/audit-logs/`
- `GET /api/error-logs/`

Filtros comuns:
- `q`, `dateFrom`, `dateTo`, `page`

Filtros específicos:
- Auditoria: `action`, `entityType`, `actorId`
- Erros: `statusCode`, `path`

### Exportação
- `GET /api/exports/students-pending.csv`

Filtros:
- `q`, `schoolId`, `status`, `ageMin`, `ageMax`, `sex`, `anonymized`

Características:
- Delimitador `;`
- `anonymized=true` converte nome para iniciais.

## Mensagens de erro
- Erros incluem `trace_id` para correlação.
- Duplicidade de regra vacinal retorna mensagem amigável indicando vacina, dose e versão.
