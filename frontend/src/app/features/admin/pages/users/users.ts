import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';

import { School, UserItem, UserRole } from '../../../../shared/models/api.models';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private readonly dialogConfig = {
    width: '760px',
    maxWidth: '95vw',
    autoFocus: false,
    panelClass: 'app-dialog',
  };
  users: UserItem[] = [];
  schools: School[] = [];
  editingId: number | null = null;
  formDialogRef?: MatDialogRef<unknown>;

  @ViewChild('userFormDialog') userFormDialog?: TemplateRef<unknown>;

  roles: UserRole[] = ['ADMIN', 'SCHOOL_OPERATOR', 'SCHOOL_MANAGER', 'HEALTH_PRO', 'HEALTH_MANAGER'];
  private roleLabels: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    SCHOOL_OPERATOR: 'Operador escola',
    SCHOOL_MANAGER: 'Gestor escola',
    HEALTH_PRO: 'Profissional saude',
    HEALTH_MANAGER: 'Gestor saude',
  };

  form = this.fb.nonNullable.group({
    email: [''],
    password: [''],
    full_name: [''],
    role: ['SCHOOL_OPERATOR'],
    school: [0],
    is_active: [true],
  });

  constructor(
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.adminService.listSchools().subscribe((schools) => (this.schools = schools));
  }

  load(): void {
    this.adminService.listUsers().subscribe((users) => (this.users = users));
  }

  edit(user: UserItem): void {
    this.editingId = user.id;
    this.form.patchValue({ ...user, school: user.school ?? 0, password: '' });
    this.openDialog();
  }

  openCreateModal(): void {
    this.clear();
    this.openDialog();
  }

  clear(): void {
    this.editingId = null;
    this.form.reset({
      email: '',
      password: '',
      full_name: '',
      role: 'SCHOOL_OPERATOR',
      school: 0,
      is_active: true,
    });
  }

  save(): void {
    const raw = this.form.getRawValue();
    const payload = {
      email: raw.email,
      password: raw.password,
      full_name: raw.full_name,
      role: raw.role as UserRole,
      school: raw.school === 0 ? null : raw.school,
      is_active: raw.is_active,
    };

    const request$ = this.editingId
      ? this.adminService.updateUser(this.editingId, payload)
      : this.adminService.createUser({ ...payload, password: payload.password || 'Senha@123' });

    request$.subscribe(() => {
      this.clear();
      this.closeDialog();
      this.load();
    });
  }

  getRoleLabel(role: UserRole): string {
    return this.roleLabels[role] ?? role;
  }

  roleClass(role: UserRole): string {
    return `role-pill role-${role.toLowerCase().replace('_', '-')}`;
  }

  getRoleCount(role: UserRole): number {
    return this.users.filter((item) => item.role === role).length;
  }

  getActiveUsersCount(): number {
    return this.users.filter((item) => item.is_active).length;
  }

  closeDialog(): void {
    this.formDialogRef?.close();
  }

  private openDialog(): void {
    if (!this.userFormDialog) {
      return;
    }
    this.formDialogRef = this.dialog.open(this.userFormDialog, this.dialogConfig);
    this.formDialogRef.afterClosed().subscribe(() => this.clear());
  }
}
