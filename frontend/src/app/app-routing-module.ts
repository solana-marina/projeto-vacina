import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { HomeRedirect } from './core/layout/home-redirect/home-redirect';
import { MainLayout } from './core/layout/main-layout/main-layout';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth-module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeRedirect },
      {
        path: 'school',
        canActivate: [RoleGuard],
        data: { roles: ['SCHOOL_OPERATOR', 'SCHOOL_MANAGER'] },
        loadChildren: () => import('./features/school/school-module').then((m) => m.SchoolModule),
      },
      {
        path: 'health',
        canActivate: [RoleGuard],
        data: { roles: ['HEALTH_PRO', 'HEALTH_MANAGER'] },
        loadChildren: () => import('./features/health/health-module').then((m) => m.HealthModule),
      },
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () => import('./features/admin/admin-module').then((m) => m.AdminModule),
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
