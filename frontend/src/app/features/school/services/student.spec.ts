import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { StudentService } from './student';

describe('StudentService', () => {
  let service: StudentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StudentService],
    });

    service = TestBed.inject(StudentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends students list filters', () => {
    service.listStudents({ q: 'Ana', status: 'ATRASADO', page: 2 }).subscribe((res) => {
      expect(res.count).toBe(1);
    });

    const req = httpMock.expectOne((request) => request.url === 'http://localhost:8000/api/students/');
    expect(req.request.params.get('q')).toBe('Ana');
    expect(req.request.params.get('status')).toBe('ATRASADO');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ count: 1, results: [] });
  });
});
