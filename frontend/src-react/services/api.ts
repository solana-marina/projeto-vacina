import { apiClient } from './http';
import { buildQueryParams, unwrapList } from './helpers';
import {
  AgeDistributionItem,
  AgeBucket,
  AuditLogItem,
  AuthResponse,
  CoverageItem,
  ErrorLogItem,
  ImmunizationStatus,
  PaginatedResponse,
  Schedule,
  ScheduleRule,
  School,
  Student,
  UserItem,
  Vaccine,
  VaccinationRecord,
} from '../types/api';

export interface StudentQuery {
  q?: string;
  status?: string;
  schoolId?: number;
  vaccineId?: number;
  page?: number;
  ageMin?: number;
  ageMax?: number;
  sex?: 'F' | 'M' | 'NI';
}

export const api = {
  login(email: string, password: string) {
    return apiClient.post<AuthResponse>('/auth/token/', { email, password }).then((res) => res.data);
  },

  listStudents(query: StudentQuery) {
    const params = buildQueryParams(query as Record<string, unknown>);
    return apiClient.get<PaginatedResponse<Student>>('/students/', { params }).then((res) => res.data);
  },

  getStudent(id: number) {
    return apiClient.get<Student>(`/students/${id}/`).then((res) => res.data);
  },

  createStudent(payload: Partial<Student>) {
    return apiClient.post<Student>('/students/', payload).then((res) => res.data);
  },

  updateStudent(id: number, payload: Partial<Student>) {
    return apiClient.patch<Student>(`/students/${id}/`, payload).then((res) => res.data);
  },

  getImmunizationStatus(studentId: number) {
    return apiClient.get<ImmunizationStatus>(`/students/${studentId}/immunization-status/`).then((res) => res.data);
  },

  listVaccinations(studentId: number) {
    return apiClient.get<VaccinationRecord[]>(`/students/${studentId}/vaccinations/`).then((res) => res.data);
  },

  addVaccination(studentId: number, payload: Partial<VaccinationRecord>) {
    return apiClient.post<VaccinationRecord>(`/students/${studentId}/vaccinations/`, payload).then((res) => res.data);
  },

  updateVaccination(recordId: number, payload: Partial<VaccinationRecord>) {
    return apiClient.patch<VaccinationRecord>(`/vaccinations/${recordId}/`, payload).then((res) => res.data);
  },

  deleteVaccination(recordId: number) {
    return apiClient.delete(`/vaccinations/${recordId}/`).then(() => undefined);
  },

  listSchools() {
    return apiClient.get<School[] | PaginatedResponse<School>>('/schools/').then((res) => unwrapList(res.data));
  },

  createSchool(payload: Partial<School>) {
    return apiClient.post<School>('/schools/', payload).then((res) => res.data);
  },

  updateSchool(id: number, payload: Partial<School>) {
    return apiClient.patch<School>(`/schools/${id}/`, payload).then((res) => res.data);
  },

  listUsers() {
    return apiClient.get<UserItem[] | PaginatedResponse<UserItem>>('/users/').then((res) => unwrapList(res.data));
  },

  createUser(payload: Partial<UserItem> & { password: string }) {
    return apiClient.post<UserItem>('/users/', payload).then((res) => res.data);
  },

  updateUser(id: number, payload: Partial<UserItem>) {
    return apiClient.patch<UserItem>(`/users/${id}/`, payload).then((res) => res.data);
  },

  listVaccines() {
    return apiClient.get<Vaccine[] | PaginatedResponse<Vaccine>>('/vaccines/').then((res) => unwrapList(res.data));
  },

  createVaccine(payload: Partial<Vaccine>) {
    return apiClient.post<Vaccine>('/vaccines/', payload).then((res) => res.data);
  },

  updateVaccine(id: number, payload: Partial<Vaccine>) {
    return apiClient.patch<Vaccine>(`/vaccines/${id}/`, payload).then((res) => res.data);
  },

  deleteVaccine(id: number) {
    return apiClient.delete(`/vaccines/${id}/`).then(() => undefined);
  },

  listSchedules() {
    return apiClient.get<Schedule[] | PaginatedResponse<Schedule>>('/schedules/').then((res) => unwrapList(res.data));
  },

  createSchedule(payload: Partial<Schedule>) {
    return apiClient.post<Schedule>('/schedules/', payload).then((res) => res.data);
  },

  updateSchedule(id: number, payload: Partial<Schedule>) {
    return apiClient.patch<Schedule>(`/schedules/${id}/`, payload).then((res) => res.data);
  },

  listRules(scheduleId: number) {
    return apiClient.get<ScheduleRule[]>(`/schedules/${scheduleId}/rules/`).then((res) => res.data);
  },

  createRule(scheduleId: number, payload: Partial<ScheduleRule>) {
    return apiClient.post<ScheduleRule>(`/schedules/${scheduleId}/rules/`, payload).then((res) => res.data);
  },

  updateRule(scheduleId: number, ruleId: number, payload: Partial<ScheduleRule>) {
    return apiClient.patch<ScheduleRule>(`/schedules/${scheduleId}/rules/${ruleId}/`, payload).then((res) => res.data);
  },

  deleteRule(scheduleId: number, ruleId: number) {
    return apiClient.delete(`/schedules/${scheduleId}/rules/${ruleId}/`).then(() => undefined);
  },

  getCoverage(schoolId?: number) {
    const params = buildQueryParams({ schoolId });
    return apiClient
      .get<{ items: CoverageItem[] }>('/dashboards/schools/coverage/', { params })
      .then((res) => res.data.items);
  },

  getRanking() {
    return apiClient.get<{ items: CoverageItem[] }>('/dashboards/schools/ranking/').then((res) => res.data.items);
  },

  getAgeDistribution(schoolId?: number) {
    const params = buildQueryParams({ schoolId });
    return apiClient
      .get<{ items: AgeDistributionItem[] }>('/dashboards/age-distribution/', { params })
      .then((res) => res.data.items);
  },

  getCoverageFiltered(query: StudentQuery) {
    const params = buildQueryParams(query as Record<string, unknown>);
    return apiClient
      .get<{ items: CoverageItem[] }>('/dashboards/schools/coverage/', { params })
      .then((res) => res.data.items);
  },

  getRankingFiltered(query: StudentQuery) {
    const params = buildQueryParams(query as Record<string, unknown>);
    return apiClient.get<{ items: CoverageItem[] }>('/dashboards/schools/ranking/', { params }).then((res) => res.data.items);
  },

  getAgeDistributionFiltered(query: StudentQuery) {
    const params = buildQueryParams(query as Record<string, unknown>);
    return apiClient
      .get<{ items: AgeDistributionItem[] }>('/dashboards/age-distribution/', { params })
      .then((res) => res.data.items);
  },

  getAgeBucketsPreference() {
    return apiClient
      .get<{ ageBuckets: AgeBucket[] }>('/dashboards/preferences/age-buckets/')
      .then((res) => res.data.ageBuckets);
  },

  updateAgeBucketsPreference(ageBuckets: AgeBucket[]) {
    return apiClient
      .put<{ ageBuckets: AgeBucket[] }>('/dashboards/preferences/age-buckets/', { ageBuckets })
      .then((res) => res.data.ageBuckets);
  },

  listAuditLogs(query: Record<string, unknown>) {
    const params = buildQueryParams(query);
    return apiClient
      .get<PaginatedResponse<AuditLogItem>>('/audit-logs/', { params })
      .then((res) => res.data);
  },

  listErrorLogs(query: Record<string, unknown>) {
    const params = buildQueryParams(query);
    return apiClient
      .get<PaginatedResponse<ErrorLogItem>>('/error-logs/', { params })
      .then((res) => res.data);
  },

  exportPendingCsv(query: StudentQuery, anonymized = false) {
    const params = buildQueryParams({ ...(query as Record<string, unknown>), anonymized });
    return apiClient
      .get('/exports/students-pending.csv', {
        params,
        responseType: 'blob',
      })
      .then((res) => res.data);
  },
};
