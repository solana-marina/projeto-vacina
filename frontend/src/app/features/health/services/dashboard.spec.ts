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

    const req = httpMock.expectOne('http://localhost:8000/api/dashboards/schools/coverage/');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [{ schoolName: 'A' }] });
  });
});
