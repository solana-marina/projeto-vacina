import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  PaginatedResponse,
  Schedule,
  ScheduleRule,
  School,
  UserItem,
  Vaccine,
} from '../../../shared/models/api.models';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private unwrapList<T>(payload: T[] | PaginatedResponse<T>): T[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    return payload.results;
  }

  listSchools(): Observable<School[]> {
    return this.http.get<School[] | PaginatedResponse<School>>(`${this.apiUrl}/schools/`).pipe(map((res) => this.unwrapList(res)));
  }

  createSchool(payload: Partial<School>): Observable<School> {
    return this.http.post<School>(`${this.apiUrl}/schools/`, payload);
  }

  updateSchool(id: number, payload: Partial<School>): Observable<School> {
    return this.http.patch<School>(`${this.apiUrl}/schools/${id}/`, payload);
  }

  listUsers(): Observable<UserItem[]> {
    return this.http.get<UserItem[] | PaginatedResponse<UserItem>>(`${this.apiUrl}/users/`).pipe(map((res) => this.unwrapList(res)));
  }

  createUser(payload: Partial<UserItem> & { password: string }): Observable<UserItem> {
    return this.http.post<UserItem>(`${this.apiUrl}/users/`, payload);
  }

  updateUser(id: number, payload: Partial<UserItem>): Observable<UserItem> {
    return this.http.patch<UserItem>(`${this.apiUrl}/users/${id}/`, payload);
  }

  listVaccines(): Observable<Vaccine[]> {
    return this.http.get<Vaccine[] | PaginatedResponse<Vaccine>>(`${this.apiUrl}/vaccines/`).pipe(map((res) => this.unwrapList(res)));
  }

  createVaccine(payload: Partial<Vaccine>): Observable<Vaccine> {
    return this.http.post<Vaccine>(`${this.apiUrl}/vaccines/`, payload);
  }

  updateVaccine(id: number, payload: Partial<Vaccine>): Observable<Vaccine> {
    return this.http.patch<Vaccine>(`${this.apiUrl}/vaccines/${id}/`, payload);
  }

  deleteVaccine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vaccines/${id}/`);
  }

  listSchedules(): Observable<Schedule[]> {
    return this.http
      .get<Schedule[] | PaginatedResponse<Schedule>>(`${this.apiUrl}/schedules/`)
      .pipe(map((res) => this.unwrapList(res)));
  }

  createSchedule(payload: Partial<Schedule>): Observable<Schedule> {
    return this.http.post<Schedule>(`${this.apiUrl}/schedules/`, payload);
  }

  updateSchedule(id: number, payload: Partial<Schedule>): Observable<Schedule> {
    return this.http.patch<Schedule>(`${this.apiUrl}/schedules/${id}/`, payload);
  }

  listRules(scheduleId: number): Observable<ScheduleRule[]> {
    return this.http.get<ScheduleRule[]>(`${this.apiUrl}/schedules/${scheduleId}/rules/`);
  }

  createRule(scheduleId: number, payload: Partial<ScheduleRule>): Observable<ScheduleRule> {
    return this.http.post<ScheduleRule>(`${this.apiUrl}/schedules/${scheduleId}/rules/`, payload);
  }

  updateRule(scheduleId: number, ruleId: number, payload: Partial<ScheduleRule>): Observable<ScheduleRule> {
    return this.http.patch<ScheduleRule>(`${this.apiUrl}/schedules/${scheduleId}/rules/${ruleId}/`, payload);
  }
}
