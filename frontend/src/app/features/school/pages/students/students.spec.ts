import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth';
import { SharedModule } from '../../../../shared/shared-module';
import { Students } from './students';
import { StudentService } from '../../services/student';

describe('Students', () => {
  let component: Students;
  let fixture: ComponentFixture<Students>;
  let studentServiceSpy: jasmine.SpyObj<StudentService>;

  beforeEach(async () => {
    studentServiceSpy = jasmine.createSpyObj<StudentService>('StudentService', [
      'listStudents',
      'createStudent',
      'updateStudent',
    ]);

    studentServiceSpy.listStudents.and.returnValue(of({ count: 1, results: [] } as any));
    studentServiceSpy.createStudent.and.returnValue(of({ id: 1 } as any));
    studentServiceSpy.updateStudent.and.returnValue(of({ id: 1 } as any));

    await TestBed.configureTestingModule({
      declarations: [Students],
      imports: [ReactiveFormsModule, SharedModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: StudentService, useValue: studentServiceSpy },
        {
          provide: AuthService,
          useValue: {
            getCurrentSession: () => ({ role: 'SCHOOL_OPERATOR', schoolId: 1 }),
          },
        },
        { provide: ActivatedRoute, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Students);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads students on init', () => {
    expect(studentServiceSpy.listStudents).toHaveBeenCalled();
  });

  it('saves new student', () => {
    component.studentForm.patchValue({
      school: 1,
      full_name: 'Aluno',
      birth_date: '2020-01-01',
    });

    component.saveStudent();

    expect(studentServiceSpy.createStudent).toHaveBeenCalled();
  });
});
