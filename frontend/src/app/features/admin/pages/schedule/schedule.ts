import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Schedule as ScheduleModel, ScheduleRule, Vaccine } from '../../../../shared/models/api.models';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-schedule',
  standalone: false,
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
})
export class Schedule implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private readonly dialogConfig = {
    width: '760px',
    maxWidth: '95vw',
    autoFocus: false,
    panelClass: 'app-dialog',
  };
  schedules: ScheduleModel[] = [];
  vaccines: Vaccine[] = [];
  rules: ScheduleRule[] = [];
  selectedScheduleId: number | null = null;
  scheduleDialogRef?: MatDialogRef<unknown>;
  ruleDialogRef?: MatDialogRef<unknown>;
  vaccineDialogRef?: MatDialogRef<unknown>;
  editingVaccineId: number | null = null;
  returnToRuleAfterVaccine = false;

  @ViewChild('scheduleFormDialog') scheduleFormDialog?: TemplateRef<unknown>;
  @ViewChild('ruleFormDialog') ruleFormDialog?: TemplateRef<unknown>;
  @ViewChild('vaccineFormDialog') vaccineFormDialog?: TemplateRef<unknown>;

  scheduleForm = this.fb.nonNullable.group({
    code: [''],
    name: [''],
    is_active: [false],
  });

  ruleForm = this.fb.nonNullable.group({
    vaccine: [0],
    dose_number: [1],
    recommended_min_age_months: [0],
    recommended_max_age_months: [0],
  });

  vaccineForm = this.fb.nonNullable.group({
    code: [''],
    name: [''],
  });

  constructor(
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.adminService.listSchedules().subscribe((schedules) => {
      this.schedules = schedules;
      const active = schedules.find((item) => item.is_active);
      this.selectedScheduleId = active?.id ?? schedules[0]?.id ?? null;
      if (this.selectedScheduleId) {
        this.loadRules(this.selectedScheduleId);
      }
    });
    this.loadVaccines();
  }

  loadRules(scheduleId: number): void {
    this.selectedScheduleId = scheduleId;
    this.adminService.listRules(scheduleId).subscribe((rules) => (this.rules = rules));
  }

  saveSchedule(): void {
    const raw = this.scheduleForm.getRawValue();
    this.adminService
      .createSchedule({
        code: raw.code,
        name: raw.name,
        is_active: raw.is_active,
      })
      .subscribe(() => {
        this.scheduleForm.reset({ code: '', name: '', is_active: false });
        this.closeScheduleDialog();
        this.loadAll();
      });
  }

  activate(schedule: ScheduleModel): void {
    this.adminService.updateSchedule(schedule.id, { is_active: true }).subscribe(() => this.loadAll());
  }

  saveRule(): void {
    if (!this.selectedScheduleId) {
      return;
    }

    const raw = this.ruleForm.getRawValue();
    if (!raw.vaccine) {
      this.snackbar.open('Cadastre uma vacina antes de salvar a regra.', 'Fechar', { duration: 3500 });
      return;
    }

    this.adminService
      .createRule(this.selectedScheduleId, {
        vaccine: raw.vaccine,
        dose_number: raw.dose_number,
        recommended_min_age_months: raw.recommended_min_age_months,
        recommended_max_age_months: raw.recommended_max_age_months,
      })
      .subscribe(() => {
        this.ruleForm.patchValue({
          dose_number: 1,
          recommended_min_age_months: 0,
          recommended_max_age_months: 0,
        });
        this.closeRuleDialog();
        this.loadRules(this.selectedScheduleId!);
      });
  }

  getActiveSchedulesCount(): number {
    return this.schedules.filter((schedule) => schedule.is_active).length;
  }

  openScheduleModal(): void {
    this.scheduleForm.reset({ code: '', name: '', is_active: false });
    if (!this.scheduleFormDialog) {
      return;
    }
    this.scheduleDialogRef = this.dialog.open(this.scheduleFormDialog, this.dialogConfig);
  }

  openRuleModal(): void {
    if (!this.selectedScheduleId || !this.ruleFormDialog || this.vaccines.length === 0) {
      if (this.vaccines.length === 0) {
        this.snackbar.open('Cadastre ao menos uma vacina para criar regras.', 'Fechar', { duration: 3500 });
      }
      return;
    }
    const selectedVaccine = this.ruleForm.getRawValue().vaccine;
    const safeVaccineId =
      this.vaccines.find((item) => item.id === selectedVaccine)?.id ??
      this.vaccines[0]?.id ??
      0;

    this.ruleForm.patchValue({
      dose_number: 1,
      recommended_min_age_months: 0,
      recommended_max_age_months: 0,
      vaccine: safeVaccineId,
    });
    this.ruleDialogRef = this.dialog.open(this.ruleFormDialog, this.dialogConfig);
  }

  closeScheduleDialog(): void {
    this.scheduleDialogRef?.close();
  }

  closeRuleDialog(): void {
    this.ruleDialogRef?.close();
  }

  openCreateVaccineModal(): void {
    this.returnToRuleAfterVaccine = false;
    this.editingVaccineId = null;
    this.vaccineForm.reset({ code: '', name: '' });
    this.openVaccineDialog();
  }

  openEditVaccineModal(vaccine: Vaccine): void {
    this.returnToRuleAfterVaccine = false;
    this.editingVaccineId = vaccine.id;
    this.vaccineForm.patchValue({ code: vaccine.code, name: vaccine.name });
    this.openVaccineDialog();
  }

  saveVaccine(): void {
    const raw = this.vaccineForm.getRawValue();
    const payload = {
      code: raw.code.trim(),
      name: raw.name.trim(),
    };

    if (!payload.code || !payload.name) {
      this.snackbar.open('Preencha código e nome da vacina.', 'Fechar', { duration: 3000 });
      return;
    }

    const request$ = this.editingVaccineId
      ? this.adminService.updateVaccine(this.editingVaccineId, payload)
      : this.adminService.createVaccine(payload);

    request$.subscribe({
      next: (savedVaccine) => {
        const shouldReturnToRule = this.returnToRuleAfterVaccine;
        this.returnToRuleAfterVaccine = false;
        this.closeVaccineDialog();
        this.loadVaccines(savedVaccine.id);
        if (shouldReturnToRule) {
          this.ruleForm.patchValue({ vaccine: savedVaccine.id });
          this.openRuleModal();
        }
      },
    });
  }

  deleteVaccine(vaccine: Vaccine): void {
    const confirmed = window.confirm(`Excluir vacina "${vaccine.code} - ${vaccine.name}"?`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteVaccine(vaccine.id).subscribe({
      next: () => this.loadVaccines(),
      error: () => {
        this.snackbar.open(
          'Não foi possível excluir. Verifique se a vacina está vinculada a alguma regra/registro.',
          'Fechar',
          { duration: 5000 },
        );
      },
    });
  }

  openCreateVaccineFromRule(): void {
    this.returnToRuleAfterVaccine = true;
    this.closeRuleDialog();
    this.openCreateVaccineModal();
  }

  closeVaccineDialog(): void {
    this.vaccineDialogRef?.close();
    this.editingVaccineId = null;
  }

  private loadVaccines(preferredVaccineId?: number): void {
    this.adminService.listVaccines().subscribe((vaccines) => {
      this.vaccines = vaccines;
      const currentVaccine = this.ruleForm.getRawValue().vaccine;
      const safeVaccineId =
        this.vaccines.find((item) => item.id === preferredVaccineId)?.id ??
        this.vaccines.find((item) => item.id === currentVaccine)?.id ??
        this.vaccines[0]?.id ??
        0;
      this.ruleForm.patchValue({ vaccine: safeVaccineId });
    });
  }

  private openVaccineDialog(): void {
    if (!this.vaccineFormDialog) {
      return;
    }
    this.vaccineDialogRef = this.dialog.open(this.vaccineFormDialog, this.dialogConfig);
    this.vaccineDialogRef.afterClosed().subscribe(() => {
      if (this.returnToRuleAfterVaccine) {
        this.returnToRuleAfterVaccine = false;
      }
      this.editingVaccineId = null;
      this.vaccineForm.reset({ code: '', name: '' });
    });
  }
}
