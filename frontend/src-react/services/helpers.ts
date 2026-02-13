import { AuthResponse, PaginatedResponse } from '../types/api';

export function unwrapList<T>(payload: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

export function buildQueryParams(query: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return params;
}

export function buildSession(response: AuthResponse) {
  return {
    userId: response.user_id,
    fullName: response.full_name,
    email: response.email,
    role: response.role,
    schoolId: response.school_id,
  };
}
