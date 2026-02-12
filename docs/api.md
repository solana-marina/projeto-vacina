# API

## Autenticacao
### Obter token
`POST /api/auth/token/`

Payload:
```json
{
  "email": "admin@vacina.local",
  "password": "Admin@123"
}
```

Resposta (resumo):
```json
{
  "access": "...",
  "refresh": "...",
  "role": "ADMIN",
  "school_id": null,
  "full_name": "Admin Sistema",
  "email": "admin@vacina.local",
  "user_id": 1
}
```

### Refresh
`POST /api/auth/token/refresh/`

## Header de autorizacao
`Authorization: Bearer <access_token>`

## Endpoints principais
- `GET/POST/PATCH/DELETE /api/users/` (admin)
- `GET/POST/PATCH/DELETE /api/schools/`
- `GET/POST/PATCH/DELETE /api/students/`
- `GET /api/students/{id}/immunization-status/`
- `GET/POST /api/students/{id}/vaccinations/`
- `PATCH/DELETE /api/vaccinations/{recordId}/`
- `GET/POST/PATCH/DELETE /api/vaccines/`
- `GET/POST/PATCH/DELETE /api/schedules/`
- `GET/POST /api/schedules/{id}/rules/`
- `PATCH/DELETE /api/schedules/{id}/rules/{ruleId}/`
- `GET /api/dashboards/schools/coverage/`
- `GET /api/dashboards/schools/ranking/`
- `GET /api/dashboards/age-distribution/`
- `GET /api/exports/students-pending.csv`

## Exemplos de consulta
### Lista de estudantes com filtros
`GET /api/students/?q=ana&status=ATRASADO&ageMin=12&ageMax=120&page=1`

### Export CSV de pendencias
`GET /api/exports/students-pending.csv?schoolId=1&status=ATRASADO`

## Swagger
- UI: `http://localhost:8000/api/docs/`
- Schema: `http://localhost:8000/api/schema/`
