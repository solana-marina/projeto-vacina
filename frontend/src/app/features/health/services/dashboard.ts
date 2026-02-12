import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AgeDistributionItem, CoverageItem } from '../../../shared/models/api.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCoverage(): Observable<{ items: CoverageItem[] }> {
    return this.http.get<{ items: CoverageItem[] }>(`${this.apiUrl}/dashboards/schools/coverage/`);
  }

  getRanking(): Observable<{ items: CoverageItem[] }> {
    return this.http.get<{ items: CoverageItem[] }>(`${this.apiUrl}/dashboards/schools/ranking/`);
  }

  getAgeDistribution(): Observable<{ items: AgeDistributionItem[] }> {
    return this.http.get<{ items: AgeDistributionItem[] }>(`${this.apiUrl}/dashboards/age-distribution/`);
  }
}
