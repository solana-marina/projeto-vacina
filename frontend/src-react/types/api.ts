export type UserRole = 'ADMIN' | 'ESCOLA' | 'SAUDE';

export interface AuthResponse {
  access: string;
  refresh: string;
  role: UserRole;
  full_name: string;
  email: string;
  school_id: number | null;
  user_id: number;
}

export interface UserSession {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  schoolId: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface School {
  id: number;
  name: string;
  inep_code: string;
  address: string;
  territory_ref: string;
}

export interface Student {
  id: number;
  school: number;
  school_name: string;
  full_name: string;
  birth_date: string;
  sex: 'F' | 'M' | 'NI';
  guardian_name: string;
  guardian_contact: string;
  age_months: number;
  current_status: 'EM_DIA' | 'ATRASADO' | 'INCOMPLETO' | 'SEM_DADOS';
}

export interface ImmunizationPending {
  vaccineCode: string;
  vaccineName: string;
  doseNumber: number;
  recommendedMinAgeMonths: number;
  recommendedMaxAgeMonths: number;
  status: 'PENDENTE' | 'ATRASADA';
}

export interface ImmunizationStatus {
  studentId: number;
  studentName: string;
  ageMonths: number;
  status: 'EM_DIA' | 'ATRASADO' | 'INCOMPLETO' | 'SEM_DADOS';
  asOfDate: string;
  activeScheduleCode: string | null;
  pending: ImmunizationPending[];
}

export interface Vaccine {
  id: number;
  code: string;
  name: string;
}

export interface VaccinationRecord {
  id: number;
  student: number;
  vaccine: number;
  vaccine_name: string;
  dose_number: number;
  application_date: string;
  source: 'INFORMADO_ESCOLA' | 'CONFIRMADO_SAUDE';
  notes: string;
}

export interface UserItem {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  school: number | null;
  is_active: boolean;
}

export interface Schedule {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  rules_count: number;
}

export interface ScheduleRule {
  id: number;
  schedule_version: number;
  vaccine: number;
  vaccine_name: string;
  dose_number: number;
  recommended_min_age_months: number;
  recommended_max_age_months: number;
}

export interface CoverageItem {
  schoolId: number;
  schoolName: string;
  totalStudents: number;
  EM_DIA: number;
  ATRASADO: number;
  INCOMPLETO: number;
  SEM_DADOS: number;
  coveragePercent: number;
  delayPercent?: number;
  noDataPercent?: number;
}

export interface AgeDistributionItem {
  ageBucket: string;
  pendingCount: number;
  overdueCount: number;
}

export interface AgeBucket {
  label: string;
  minMonths: number;
  maxMonths: number;
}

export interface AuditLogItem {
  id: number;
  actor: number | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  details_json: Record<string, unknown>;
}

export interface ErrorLogItem {
  id: number;
  actor: number | null;
  actor_email: string | null;
  method: string;
  path: string;
  status_code: number;
  message: string;
  trace_id: string;
  details_json: Record<string, unknown>;
  timestamp: string;
}
