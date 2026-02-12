import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';

import { School } from '../../../../shared/models/api.models';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-schools',
  standalone: false,
  templateUrl: './schools.html',
  styleUrl: './schools.scss',
})
export class Schools implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private readonly dialogConfig = {
    width: '760px',
    maxWidth: '95vw',
    autoFocus: false,
    panelClass: 'app-dialog',
  };
  schools: School[] = [];
  editingId: number | null = null;
  formDialogRef?: MatDialogRef<unknown>;

  @ViewChild('schoolFormDialog') schoolFormDialog?: TemplateRef<unknown>;

  form = this.fb.nonNullable.group({
    name: [''],
    inep_code: [''],
    address: [''],
    territory_ref: [''],
  });

  constructor(
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.listSchools().subscribe((schools) => (this.schools = schools));
  }

  edit(item: School): void {
    this.editingId = item.id;
    this.form.patchValue(item);
    this.openFormDialog();
  }

  openCreateModal(): void {
    this.clear();
    this.openFormDialog();
  }

  clear(): void {
    this.editingId = null;
    this.form.reset();
  }

  save(): void {
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      inep_code: raw.inep_code,
      address: raw.address,
      territory_ref: raw.territory_ref,
    };
    const request$ = this.editingId
      ? this.adminService.updateSchool(this.editingId, payload)
      : this.adminService.createSchool(payload);

    request$.subscribe(() => {
      this.clear();
      this.closeDialog();
      this.load();
    });
  }

  closeDialog(): void {
    this.formDialogRef?.close();
  }

  private openFormDialog(): void {
    if (!this.schoolFormDialog) {
      return;
    }
    this.formDialogRef = this.dialog.open(this.schoolFormDialog, this.dialogConfig);
    this.formDialogRef.afterClosed().subscribe(() => this.clear());
  }
}
