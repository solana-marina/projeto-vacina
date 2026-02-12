import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AdminService } from './admin';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('covers schools endpoints', () => {
    service.listSchools().subscribe((schools) => expect(schools.length).toBe(1));
    httpMock.expectOne('/api/schools/').flush({
      count: 1,
      results: [{ id: 1, name: 'A' }],
    });

    service.createSchool({ name: 'B' }).subscribe((school) => expect(school.id).toBe(2));
    const createSchoolReq = httpMock.expectOne('/api/schools/');
    expect(createSchoolReq.request.method).toBe('POST');
    createSchoolReq.flush({ id: 2, name: 'B' });

    service.updateSchool(2, { name: 'C' }).subscribe((school) => expect(school.name).toBe('C'));
    const patchSchoolReq = httpMock.expectOne('/api/schools/2/');
    expect(patchSchoolReq.request.method).toBe('PATCH');
    patchSchoolReq.flush({ id: 2, name: 'C' });
  });

  it('covers users endpoints', () => {
    service.listUsers().subscribe((users) => expect(users.length).toBe(1));
    httpMock.expectOne('/api/users/').flush([{ id: 1, email: 'user@x.test' }]);

    service
      .createUser({
        email: 'new@x.test',
        password: 'Senha@123',
      })
      .subscribe((user) => expect(user.id).toBe(10));
    const createReq = httpMock.expectOne('/api/users/');
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ id: 10, email: 'new@x.test' });

    service.updateUser(10, { full_name: 'Updated' }).subscribe((user) => expect(user.full_name).toBe('Updated'));
    const patchReq = httpMock.expectOne('/api/users/10/');
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ id: 10, full_name: 'Updated' });
  });

  it('covers vaccines, schedules and rules endpoints', () => {
    service.listVaccines().subscribe((vaccines) => expect(vaccines.length).toBe(1));
    httpMock.expectOne('/api/vaccines/').flush({ count: 1, results: [{ id: 1, code: 'HPV' }] });

    service.createVaccine({ code: 'HPV2', name: 'HPV 2' }).subscribe((vaccine) => expect(vaccine.id).toBe(2));
    const createVaccineReq = httpMock.expectOne('/api/vaccines/');
    expect(createVaccineReq.request.method).toBe('POST');
    createVaccineReq.flush({ id: 2, code: 'HPV2', name: 'HPV 2' });

    service.updateVaccine(2, { name: 'HPV 2 Updated' }).subscribe((vaccine) => expect(vaccine.name).toContain('Updated'));
    const patchVaccineReq = httpMock.expectOne('/api/vaccines/2/');
    expect(patchVaccineReq.request.method).toBe('PATCH');
    patchVaccineReq.flush({ id: 2, name: 'HPV 2 Updated' });

    service.deleteVaccine(2).subscribe();
    const deleteVaccineReq = httpMock.expectOne('/api/vaccines/2/');
    expect(deleteVaccineReq.request.method).toBe('DELETE');
    deleteVaccineReq.flush({});

    service.listSchedules().subscribe((schedules) => expect(schedules.length).toBe(1));
    httpMock.expectOne('/api/schedules/').flush({
      count: 1,
      results: [{ id: 1, code: 'S1', name: 'Schedule' }],
    });

    service.createSchedule({ code: 'S2', name: 'Schedule 2' }).subscribe((schedule) => expect(schedule.id).toBe(2));
    const createScheduleReq = httpMock.expectOne('/api/schedules/');
    expect(createScheduleReq.request.method).toBe('POST');
    createScheduleReq.flush({ id: 2, code: 'S2' });

    service.updateSchedule(2, { name: 'Schedule 2 Updated' }).subscribe((schedule) => expect(schedule.name).toContain('Updated'));
    const patchScheduleReq = httpMock.expectOne('/api/schedules/2/');
    expect(patchScheduleReq.request.method).toBe('PATCH');
    patchScheduleReq.flush({ id: 2, name: 'Schedule 2 Updated' });

    service.listRules(2).subscribe((rules) => expect(rules.length).toBe(1));
    httpMock.expectOne('/api/schedules/2/rules/').flush([{ id: 1, dose_number: 1 }]);

    service.createRule(2, { dose_number: 2 }).subscribe((rule) => expect(rule.id).toBe(2));
    const createRuleReq = httpMock.expectOne('/api/schedules/2/rules/');
    expect(createRuleReq.request.method).toBe('POST');
    createRuleReq.flush({ id: 2, dose_number: 2 });

    service.updateRule(2, 2, { dose_number: 3 }).subscribe((rule) => expect(rule.dose_number).toBe(3));
    const patchRuleReq = httpMock.expectOne('/api/schedules/2/rules/2/');
    expect(patchRuleReq.request.method).toBe('PATCH');
    patchRuleReq.flush({ id: 2, dose_number: 3 });
  });
});
