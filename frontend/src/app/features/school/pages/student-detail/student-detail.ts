import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ImmunizationStatus,
  Student,
  Vaccine,
  VaccinationRecord,
} from '../../../../shared/models/api.models';
import { StudentService } from '../../services/student';

@Component({
  selector: 'app-student-detail',
  standalone: false,
  templateUrl: './student-detail.html',
  styleUrl: './student-detail.scss',
})
export class StudentDetail implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private readonly dialogConfig = {
    width: '760px',
    maxWidth: '95vw',
    autoFocus: false,
    panelClass: 'app-dialog',
  };
  studentId = 0;
  loading = false;
  vaccinationDialogRef?: MatDialogRef<unknown>;

  @ViewChild('vaccinationFormDialog') vaccinationFormDialog?: TemplateRef<unknown>;

  student?: Student;
  status?: ImmunizationStatus;
  vaccines: Vaccine[] = [];
  records: VaccinationRecord[] = [];

  displayedColumns = ['vaccine_name', 'dose_number', 'application_date', 'source', 'actions'];

  vaccinationForm = this.fb.nonNullable.group({
    id: [0],
    vaccine: [0],
    dose_number: [1],
    application_date: [''],
    source: ['INFORMADO_ESCOLA'],
    notes: [''],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
  ) {}

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();
    this.studentService.listVaccines().subscribe((vaccines) => {
      this.vaccines = vaccines;
      if (vaccines.length > 0 && !this.vaccinationForm.value.vaccine) {
        this.vaccinationForm.patchValue({ vaccine: vaccines[0].id });
      }
    });
  }

  loadAll(): void {
    this.loading = true;
    this.studentService.getStudent(this.studentId).subscribe((student) => (this.student = student));
    this.studentService.getImmunizationStatus(this.studentId).subscribe((status) => (this.status = status));
    this.studentService.listVaccinations(this.studentId).subscribe({
      next: (records) => {
        this.records = records;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  saveVaccination(): void {
    const raw = this.vaccinationForm.getRawValue();
    const payload = {
      vaccine: Number(raw.vaccine),
      dose_number: Number(raw.dose_number),
      application_date: raw.application_date,
      source: raw.source as 'INFORMADO_ESCOLA' | 'CONFIRMADO_SAUDE',
      notes: raw.notes,
    };

    const recordId = Number(raw.id || 0);
    const request$ = recordId
      ? this.studentService.updateVaccination(recordId, payload)
      : this.studentService.addVaccination(this.studentId, payload);

    request$.subscribe(() => {
      this.resetVaccinationForm();
      this.closeVaccinationDialog();
      this.loadAll();
    });
  }

  editRecord(record: VaccinationRecord): void {
    this.vaccinationForm.patchValue({
      id: record.id,
      vaccine: record.vaccine,
      dose_number: record.dose_number,
      application_date: record.application_date,
      source: record.source,
      notes: record.notes,
    });
    this.openVaccinationDialog();
  }

  deleteRecord(record: VaccinationRecord): void {
    this.studentService.deleteVaccination(record.id).subscribe(() => this.loadAll());
  }

  resetVaccinationForm(): void {
    this.vaccinationForm.reset({
      id: 0,
      vaccine: this.vaccines[0]?.id ?? 0,
      dose_number: 1,
      application_date: '',
      source: 'INFORMADO_ESCOLA',
      notes: '',
    });
  }

  openCreateVaccinationModal(): void {
    this.resetVaccinationForm();
    this.openVaccinationDialog();
  }

  closeVaccinationDialog(): void {
    this.vaccinationDialogRef?.close();
  }

  back(): void {
    this.router.navigate(['/school']);
  }

  statusClass(status: string | undefined): string {
    if (!status) {
      return 'status-pill';
    }
    return `status-pill status-${status.toLowerCase().replace('_', '-')}`;
  }

  sourceLabel(source: VaccinationRecord['source']): string {
    return source === 'CONFIRMADO_SAUDE' ? 'Confirmado saude' : 'Informado escola';
  }

  private openVaccinationDialog(): void {
    if (!this.vaccinationFormDialog) {
      return;
    }
    this.vaccinationDialogRef = this.dialog.open(this.vaccinationFormDialog, this.dialogConfig);
    this.vaccinationDialogRef.afterClosed().subscribe(() => this.resetVaccinationForm());
  }
}
