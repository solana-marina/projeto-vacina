import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ImmunizationStatus,
  PaginatedResponse,
  School,
  Student,
  Vaccine,
  VaccinationRecord,
} from '../../../shared/models/api.models';

interface StudentQuery {
  q?: string;
  status?: string;
  schoolId?: number;
  page?: number;
  ageMin?: number;
  ageMax?: number;
}

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private unwrapList<T>(payload: T[] | PaginatedResponse<T>): T[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    return payload.results;
  }

  listStudents(query: StudentQuery): Observable<PaginatedResponse<Student>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Student>>(`${this.apiUrl}/students/`, { params });
  }

  getStudent(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/students/${id}/`);
  }

  createStudent(payload: Partial<Student>): Observable<Student> {
    return this.http.post<Student>(`${this.apiUrl}/students/`, payload);
  }

  updateStudent(id: number, payload: Partial<Student>): Observable<Student> {
    return this.http.patch<Student>(`${this.apiUrl}/students/${id}/`, payload);
  }

  getImmunizationStatus(studentId: number): Observable<ImmunizationStatus> {
    return this.http.get<ImmunizationStatus>(`${this.apiUrl}/students/${studentId}/immunization-status/`);
  }

  listVaccinations(studentId: number): Observable<VaccinationRecord[]> {
    return this.http.get<VaccinationRecord[]>(`${this.apiUrl}/students/${studentId}/vaccinations/`);
  }

  addVaccination(studentId: number, payload: Partial<VaccinationRecord>): Observable<VaccinationRecord> {
    return this.http.post<VaccinationRecord>(`${this.apiUrl}/students/${studentId}/vaccinations/`, payload);
  }

  updateVaccination(recordId: number, payload: Partial<VaccinationRecord>): Observable<VaccinationRecord> {
    return this.http.patch<VaccinationRecord>(`${this.apiUrl}/vaccinations/${recordId}/`, payload);
  }

  deleteVaccination(recordId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vaccinations/${recordId}/`);
  }

  listSchools(): Observable<School[]> {
    return this.http.get<School[] | PaginatedResponse<School>>(`${this.apiUrl}/schools/`).pipe(map((res) => this.unwrapList(res)));
  }

  listVaccines(): Observable<Vaccine[]> {
    return this.http.get<Vaccine[] | PaginatedResponse<Vaccine>>(`${this.apiUrl}/vaccines/`).pipe(map((res) => this.unwrapList(res)));
  }

  exportPendingCsv(query: StudentQuery): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(`${this.apiUrl}/exports/students-pending.csv`, {
      params,
      responseType: 'blob',
    });
  }
}
