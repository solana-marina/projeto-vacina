# Estratégia de Testes

## Objetivo
Garantir qualidade funcional, segurança de acesso e estabilidade do **Projeto de Vacinação Contra o HPV**.

## Pirâmide de testes
1. Backend (pytest): regras de negócio, permissões, endpoints e agregações.
2. Frontend unitário (Vitest): utilitários críticos, parser de erros e controle de rotas por perfil.
3. E2E (Playwright): fluxos completos por perfil e exportação.

## Backend
### Execução
```bash
cd backend
pytest
```

### Casos principais com entrada e saída esperada
1. Migração de papéis legados
- Entrada: usuário com `role=SCHOOL_OPERATOR` e `role=HEALTH_MANAGER`.
- Saída esperada: mapeamento para `ESCOLA` e `SAUDE`.

2. Cadastro de estudante com sexo obrigatório
- Entrada: `POST /api/students/` com `sex=NI` (novo cadastro).
- Saída esperada: `400` com mensagem informando obrigatoriedade de `F` ou `M`.

3. Filtros por sexo em estudantes
- Entrada: `GET /api/students/?sex=F`.
- Saída esperada: lista filtrada apenas com estudantes `F` dentro do escopo do usuário.

4. Dashboards com filtros avançados
- Entrada: `GET /api/dashboards/*` com `schoolId`, `status`, `ageMin`, `ageMax`, `sex`.
- Saída esperada: agregações consistentes com os filtros.

5. Preferências de faixas etárias
- Entrada: `PUT /api/dashboards/preferences/age-buckets/` com faixas válidas.
- Saída esperada: persistência por usuário e uso no endpoint de distribuição etária.

6. Duplicidade de regra vacinal
- Entrada: criar regra já existente para mesma versão/vacina/dose.
- Saída esperada: `400` com mensagem amigável de duplicidade.

7. CSV com anonimização
- Entrada: `GET /api/exports/students-pending.csv?anonymized=true`.
- Saída esperada: delimitador `;` e nome convertido para iniciais.

8. Auditoria e logs de erro
- Entrada: ação crítica + erro de API.
- Saída esperada: registros em `AuditLog`/`ErrorLog`; endpoints admin-only.

### Relatórios
```bash
pytest --cov=. --cov-report=term-missing --cov-report=xml --cov-report=html
```

## Frontend unitário
### Execução
```bash
cd frontend
npm test
```

### Casos principais com entrada e saída esperada
1. Conversão de idade
- Entrada: `anos=10`, `meses=3`.
- Saída esperada: `123` meses.

2. Validação de mês
- Entrada: mês `12`.
- Saída esperada: inválido (limite `0..11`).

3. Parser de erro HTTP
- Entrada: payload com `detail`, `non_field_errors` e `trace_id`.
- Saída esperada: mensagem legível + sufixo `(trace: ...)`.

4. Role route
- Entrada: usuário autenticado sem perfil permitido.
- Saída esperada: redirecionamento para rota padrão do perfil.

## E2E
### Execução
```bash
cd frontend
npm run e2e
```

### Fluxos cobertos com entrada e saída esperada
1. Escola
- Entrada: login `operador.escola@vacina.local`.
- Saída esperada: acesso a `/school/students`, cadastro de estudante, registro vacinal e visualização de status.

2. Saúde
- Entrada: login `saude@vacina.local`.
- Saída esperada: busca ativa funcional, dashboards visíveis e exportação CSV.

3. Admin
- Entrada: login `admin@vacina.local`.
- Saída esperada: CRUD de escola/usuário/calendário, acesso a dashboards e tela de auditoria/logs.

## Saídas detalhadas dos testes
Os logs completos ficam em `test-result/` com subpasta por execução.

Padrão de arquivos:
- `01_backend_pytest.log`
- `02_frontend_unit.log`
- `03_frontend_e2e.log`
- `04_frontend_build.log`
- `SUMMARY.md`

## Convenções
- Padrão AAA (Arrange, Act, Assert).
- Uso de factories/fixtures para dados reprodutíveis.
- Asserções orientadas a comportamento e regra de negócio.
- Mensagens de erro com contexto funcional para diagnóstico.

## Diagnóstico rápido
- `401`: token ausente/inválido.
- `403`: perfil sem permissão.
- `404`: recurso inexistente ou fora do escopo do usuário.
- `trace_id` presente na resposta: correlacionar com `ErrorLog`.
