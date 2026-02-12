import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Pendencias } from './pages/pendencias/pendencias';
import { StudentDetail } from './pages/student-detail/student-detail';
import { Students } from './pages/students/students';

const routes: Routes = [
  { path: '', component: Students },
  { path: 'pending', component: Pendencias },
  { path: 'students/:id', component: StudentDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SchoolRoutingModule {}
