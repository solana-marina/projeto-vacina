import { UserRole } from '../types/api';

export const API_BASE_URL = '/api';

export const SCHOOL_ROLES: UserRole[] = ['ESCOLA'];
export const HEALTH_ROLES: UserRole[] = ['SAUDE'];

export const ALL_ROLES: UserRole[] = ['ADMIN', 'ESCOLA', 'SAUDE'];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  ESCOLA: 'Equipe escolar',
  SAUDE: 'Equipe de saúde',
};

export function statusLabel(status: string): string {
  return status.replace('_', ' ');
}
