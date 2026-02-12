import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth';
import { Student } from '../../../../shared/models/api.models';
import { StudentService } from '../../services/student';

@Component({
  selector: 'app-students',
  standalone: false,
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class Students implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private readonly dialogConfig = {
    width: '760px',
    maxWidth: '95vw',
    autoFocus: false,
    panelClass: 'app-dialog',
  };
  loading = false;
  total = 0;
  page = 1;
  editingId: number | null = null;
  studentDialogRef?: MatDialogRef<unknown>;

  @ViewChild('studentFormDialog') studentFormDialog?: TemplateRef<unknown>;

  displayedColumns = ['full_name', 'age_months', 'current_status', 'actions'];
  students: Student[] = [];

  filtersForm = this.fb.nonNullable.group({
    q: [''],
    status: [''],
  });

  studentForm = this.fb.nonNullable.group({
    school: [0],
    full_name: [''],
    birth_date: [''],
    guardian_name: [''],
    guardian_contact: [''],
    class_group: [''],
  });

  constructor(
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session?.schoolId) {
      this.studentForm.patchValue({ school: session.schoolId });
    }
    this.loadStudents();
  }

  loadStudents(page = this.page): void {
    this.loading = true;
    this.page = page;

    const session = this.authService.getCurrentSession();
    const query = {
      page,
      q: this.filtersForm.getRawValue().q || undefined,
      status: this.filtersForm.getRawValue().status || undefined,
      schoolId: session?.schoolId ?? undefined,
    };

    this.studentService.listStudents(query).subscribe({
      next: (response) => {
        this.students = response.results;
        this.total = response.count;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onPage(event: PageEvent): void {
    this.loadStudents(event.pageIndex + 1);
  }

  applyFilters(): void {
    this.loadStudents(1);
  }

  edit(student: Student): void {
    this.editingId = student.id;
    this.studentForm.patchValue({
      school: student.school,
      full_name: student.full_name,
      birth_date: student.birth_date,
      guardian_name: student.guardian_name,
      guardian_contact: student.guardian_contact,
      class_group: student.class_group,
    });
    this.openStudentDialog();
  }

  openCreateModal(): void {
    this.resetForm();
    this.openStudentDialog();
  }

  resetForm(): void {
    this.editingId = null;
    this.studentForm.reset();
    const session = this.authService.getCurrentSession();
    this.studentForm.patchValue({ school: session?.schoolId ?? 0 });
  }

  saveStudent(): void {
    const raw = this.studentForm.getRawValue();
    const payload = {
      school: Number(raw.school),
      full_name: raw.full_name,
      birth_date: raw.birth_date,
      guardian_name: raw.guardian_name,
      guardian_contact: raw.guardian_contact,
      class_group: raw.class_group,
    };

    const request$ = this.editingId
      ? this.studentService.updateStudent(this.editingId, payload)
      : this.studentService.createStudent(payload);

    request$.subscribe(() => {
      this.resetForm();
      this.closeStudentDialog();
      this.loadStudents();
    });
  }

  openDetail(student: Student): void {
    this.router.navigate(['/school/students', student.id]);
  }

  statusClass(status: string | undefined): string {
    if (!status) {
      return 'status-pill';
    }

    const normalized = status.toLowerCase().replace('_', '-');
    return `status-pill status-${normalized}`;
  }

  getStatusCount(status: Student['current_status']): number {
    return this.students.filter((item) => item.current_status === status).length;
  }

  closeStudentDialog(): void {
    this.studentDialogRef?.close();
  }

  private openStudentDialog(): void {
    if (!this.studentFormDialog) {
      return;
    }
    this.studentDialogRef = this.dialog.open(this.studentFormDialog, this.dialogConfig);
    this.studentDialogRef.afterClosed().subscribe(() => this.resetForm());
  }
}
