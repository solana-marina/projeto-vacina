import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { School, Student } from '../../../../shared/models/api.models';
import { StudentService } from '../../../school/services/student';

@Component({
  selector: 'app-active-search',
  standalone: false,
  templateUrl: './active-search.html',
  styleUrl: './active-search.scss',
})
export class ActiveSearch implements OnInit {
  private fb = inject(FormBuilder);
  loading = false;
  students: Student[] = [];
  schools: School[] = [];
  displayedColumns = ['full_name', 'school_name', 'age_months', 'current_status'];

  filters = this.fb.nonNullable.group({
    q: [''],
    schoolId: [''],
    status: [''],
    ageMin: [''],
    ageMax: [''],
  });

  constructor(
    private studentService: StudentService,
  ) {}

  ngOnInit(): void {
    this.studentService.listSchools().subscribe((schools) => (this.schools = schools));
    this.search();
  }

  search(): void {
    this.loading = true;
    const filters = this.filters.getRawValue();
    this.studentService
      .listStudents({
        page: 1,
        q: filters.q || undefined,
        schoolId: filters.schoolId ? Number(filters.schoolId) : undefined,
        status: filters.status || undefined,
        ageMin: filters.ageMin ? Number(filters.ageMin) : undefined,
        ageMax: filters.ageMax ? Number(filters.ageMax) : undefined,
      })
      .subscribe({
        next: (response) => {
          this.students = response.results;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  exportCsv(): void {
    const filters = this.filters.getRawValue();
    this.studentService
      .exportPendingCsv({
        q: filters.q || undefined,
        schoolId: filters.schoolId ? Number(filters.schoolId) : undefined,
        status: filters.status || undefined,
        ageMin: filters.ageMin ? Number(filters.ageMin) : undefined,
        ageMax: filters.ageMax ? Number(filters.ageMax) : undefined,
      })
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students_pending.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  getStatusCount(status: Student['current_status']): number {
    return this.students.filter((student) => student.current_status === status).length;
  }

  statusClass(status: string | undefined): string {
    if (!status) {
      return 'status-pill';
    }
    return `status-pill status-${status.toLowerCase().replace('_', '-')}`;
  }
}
