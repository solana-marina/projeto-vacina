import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DashboardService } from './dashboard';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls coverage endpoint', () => {
    service.getCoverage().subscribe((res) => {
      expect(res.items.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/dashboards/schools/coverage/');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [{ schoolName: 'A' }] });
  });

  it('calls ranking endpoint', () => {
    service.getRanking().subscribe((res) => {
      expect(res.items.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/dashboards/schools/ranking/');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [{ schoolName: 'A', delayPercent: 10 }] });
  });

  it('calls age distribution endpoint', () => {
    service.getAgeDistribution().subscribe((res) => {
      expect(res.items.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/dashboards/age-distribution/');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [{ ageBucket: '108+', pendingCount: 3, overdueCount: 1 }] });
  });
});
