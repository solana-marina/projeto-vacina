import { describe, expect, it } from 'vitest';

import { parseApiError } from './errors';

describe('parseApiError', () => {
  it('extrai mensagem de detail e trace_id', () => {
    const error = {
      response: {
        data: {
          detail: 'Falha de permissão',
          trace_id: 'abc123',
        },
      },
    };

    expect(parseApiError(error)).toBe('Falha de permissão (trace: abc123)');
  });

  it('flatten de mensagens de campo', () => {
    const error = {
      response: {
        data: {
          sex: ['Informe M ou F'],
          non_field_errors: ['Conflito de regra'],
        },
      },
    };

    expect(parseApiError(error)).toContain('sex: Informe M ou F');
    expect(parseApiError(error)).toContain('Conflito de regra');
  });

  it('retorna fallback quando payload está vazio', () => {
    expect(parseApiError({})).toBe('Não foi possível concluir a operação.');
  });
});
