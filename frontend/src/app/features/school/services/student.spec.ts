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

    const req = httpMock.expectOne((request) => request.url === '/api/students/');
    expect(req.request.params.get('q')).toBe('Ana');
    expect(req.request.params.get('status')).toBe('ATRASADO');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ count: 1, results: [] });
  });

  it('covers students and immunization detail endpoints', () => {
    service.getStudent(10).subscribe((student) => expect(student.id).toBe(10));
    httpMock.expectOne('/api/students/10/').flush({ id: 10 });

    service.createStudent({ full_name: 'Aluno' }).subscribe((student) => expect(student.id).toBe(11));
    const createReq = httpMock.expectOne('/api/students/');
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ id: 11 });

    service.updateStudent(11, { full_name: 'Aluno 2' }).subscribe((student) => expect(student.id).toBe(11));
    const updateReq = httpMock.expectOne('/api/students/11/');
    expect(updateReq.request.method).toBe('PATCH');
    updateReq.flush({ id: 11 });

    service.getImmunizationStatus(11).subscribe((status) => expect(status.studentId).toBe(11));
    httpMock.expectOne('/api/students/11/immunization-status/').flush({
      studentId: 11,
      pending: [],
    });
  });

  it('covers vaccinations, schools, vaccines and export endpoints', () => {
    service.listVaccinations(5).subscribe((records) => expect(records.length).toBe(1));
    httpMock.expectOne('/api/students/5/vaccinations/').flush([{ id: 1 }]);

    service.addVaccination(5, { dose_number: 1 }).subscribe((record) => expect(record.id).toBe(2));
    const createVaccinationReq = httpMock.expectOne('/api/students/5/vaccinations/');
    expect(createVaccinationReq.request.method).toBe('POST');
    createVaccinationReq.flush({ id: 2 });

    service.updateVaccination(2, { notes: 'x' }).subscribe((record) => expect(record.id).toBe(2));
    const updateVaccinationReq = httpMock.expectOne('/api/vaccinations/2/');
    expect(updateVaccinationReq.request.method).toBe('PATCH');
    updateVaccinationReq.flush({ id: 2 });

    service.deleteVaccination(2).subscribe();
    const deleteVaccinationReq = httpMock.expectOne('/api/vaccinations/2/');
    expect(deleteVaccinationReq.request.method).toBe('DELETE');
    deleteVaccinationReq.flush({});

    service.listSchools().subscribe((schools) => expect(schools.length).toBe(1));
    httpMock.expectOne('/api/schools/').flush([{ id: 1 }]);

    service.listVaccines().subscribe((vaccines) => expect(vaccines.length).toBe(1));
    httpMock.expectOne('/api/vaccines/').flush({ count: 1, results: [{ id: 1 }] });

    service.exportPendingCsv({ q: 'Ana', ageMin: 108 }).subscribe();
    const exportReq = httpMock.expectOne((request) => request.url === '/api/exports/students-pending.csv');
    expect(exportReq.request.method).toBe('GET');
    expect(exportReq.request.params.get('q')).toBe('Ana');
    expect(exportReq.request.params.get('ageMin')).toBe('108');
    expect(exportReq.request.responseType).toBe('blob');
    exportReq.flush(new Blob(['id'], { type: 'text/csv' }));
  });
});
