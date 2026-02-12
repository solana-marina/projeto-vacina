import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { UserRole, UserSession } from '../../../shared/models/api.models';
import { AuthService } from '../../services/auth';

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  session: UserSession | null = null;
  currentUrl = '';

  menuItems: MenuItem[] = [
    {
      label: 'Escola',
      icon: 'school',
      path: '/school',
      roles: ['SCHOOL_OPERATOR', 'SCHOOL_MANAGER'],
    },
    {
      label: 'Saude',
      icon: 'vaccines',
      path: '/health',
      roles: ['HEALTH_PRO', 'HEALTH_MANAGER'],
    },
    {
      label: 'Admin',
      icon: 'admin_panel_settings',
      path: '/admin',
      roles: ['ADMIN'],
    },
  ];

  private readonly roleMap: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    SCHOOL_OPERATOR: 'Operador Escolar',
    SCHOOL_MANAGER: 'Gestor Escolar',
    HEALTH_PRO: 'Profissional de Saude',
    HEALTH_MANAGER: 'Gestor de Saude',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.session = this.authService.getCurrentSession();
    this.currentUrl = this.router.url;

    this.authService.session$.pipe(takeUntil(this.destroy$)).subscribe((session) => {
      this.session = session;
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
      });
  }

  isVisible(item: MenuItem): boolean {
    if (!this.session) {
      return false;
    }
    return item.roles.includes(this.session.role);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getRoleLabel(role: UserRole | undefined): string {
    if (!role) {
      return '';
    }
    return this.roleMap[role] ?? role;
  }

  getInitials(name: string | undefined): string {
    if (!name) {
      return '--';
    }
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
