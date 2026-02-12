import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { forkJoin } from 'rxjs';

import { AgeDistributionItem, CoverageItem } from '../../../../shared/models/api.models';
import { DashboardService } from '../../services/dashboard';

@Component({
  selector: 'app-dashboards',
  standalone: false,
  templateUrl: './dashboards.html',
  styleUrl: './dashboards.scss',
})
export class Dashboards implements OnInit {
  loading = false;
  coverage: CoverageItem[] = [];
  ranking: CoverageItem[] = [];
  ageDistribution: AgeDistributionItem[] = [];

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      coverage: this.dashboardService.getCoverage(),
      ranking: this.dashboardService.getRanking(),
      ageDistribution: this.dashboardService.getAgeDistribution(),
    }).subscribe({
      next: ({ coverage, ranking, ageDistribution }) => {
        this.coverage = coverage.items;
        this.ranking = ranking.items;
        this.ageDistribution = ageDistribution.items;
        this.barChartData = {
          labels: ageDistribution.items.map((item) => item.ageBucket),
          datasets: [
            {
              label: 'Pendências',
              data: ageDistribution.items.map((item) => item.pendingCount),
              backgroundColor: '#2a9d8f',
            },
            {
              label: 'Atrasadas',
              data: ageDistribution.items.map((item) => item.overdueCount),
              backgroundColor: '#e76f51',
            },
          ],
        };
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  getCoverageAverage(): number {
    return this.getAverage(this.coverage.map((item) => item.coveragePercent));
  }

  getDelayAverage(): number {
    return this.getAverage(this.ranking.map((item) => item.delayPercent ?? 0));
  }

  getNoDataAverage(): number {
    return this.getAverage(this.ranking.map((item) => item.noDataPercent ?? 0));
  }

  private getAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const total = values.reduce((acc, value) => acc + value, 0);
    return total / values.length;
  }
}
