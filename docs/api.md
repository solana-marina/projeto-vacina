# API do Projeto de Vacinação Contra o HPV

## Autenticação
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

### Renovar token
`POST /api/auth/token/refresh/`

### Header de autorização
`Authorization: Bearer <access_token>`

## Endpoints Principais
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

## Exemplos de Consulta
### Lista de estudantes com filtros
`GET /api/students/?q=ana&status=ATRASADO&ageMin=108&ageMax=179&page=1`

### Exportação CSV de pendências
`GET /api/exports/students-pending.csv?schoolId=1&status=ATRASADO`

## Convenções Funcionais
- O status vacinal é calculado com base na idade em meses e nas regras da versão ativa do calendário.
- O escopo institucional de demonstração está focado em vacinação contra o HPV.
- Perfis escolares têm acesso restrito à própria escola; saúde e administração possuem visão consolidada conforme permissões.

## Swagger / OpenAPI
- UI: `http://localhost:8000/api/docs/`
- Schema: `http://localhost:8000/api/schema/`
