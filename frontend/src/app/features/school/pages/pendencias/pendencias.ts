import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Student } from '../../../../shared/models/api.models';
import { StudentService } from '../../services/student';

@Component({
  selector: 'app-pendencias',
  standalone: false,
  templateUrl: './pendencias.html',
  styleUrl: './pendencias.scss',
})
export class Pendencias implements OnInit {
  private fb = inject(FormBuilder);
  students: Student[] = [];
  loading = false;

  filters = this.fb.nonNullable.group({
    status: ['ATRASADO'],
    q: [''],
  });

  constructor(
    private studentService: StudentService,
  ) {}

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.loading = true;
    this.studentService
      .listStudents({
        page: 1,
        status: this.filters.getRawValue().status || 'ATRASADO',
        q: this.filters.getRawValue().q || undefined,
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

  statusClass(status: string | undefined): string {
    if (!status) {
      return 'status-pill';
    }
    return `status-pill status-${status.toLowerCase().replace('_', '-')}`;
  }
}
