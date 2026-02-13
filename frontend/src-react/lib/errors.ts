import { AxiosError } from 'axios';

function flatten(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => flatten(item));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
      const nestedMessages = flatten(nested);
      if (nestedMessages.length === 0) {
        return [];
      }
      if (['detail', 'non_field_errors'].includes(key)) {
        return nestedMessages;
      }
      if (key === 'trace_id') {
        return [];
      }
      return nestedMessages.map((message) => `${key}: ${message}`);
    });
  }
  return ['Erro desconhecido'];
}

export function parseApiError(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  const axiosError = error as AxiosError<{ detail?: unknown; trace_id?: string } & Record<string, unknown>>;
  const payload = axiosError?.response?.data;
  const messages = flatten(payload);
  const message = messages.length > 0 ? messages.join(' | ') : fallback;

  if (payload && typeof payload === 'object' && payload.trace_id) {
    return `${message} (trace: ${String(payload.trace_id)})`;
  }
  return message;
}
