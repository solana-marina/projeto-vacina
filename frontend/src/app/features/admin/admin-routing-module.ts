import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Schedule } from './pages/schedule/schedule';
import { Schools } from './pages/schools/schools';
import { Users } from './pages/users/users';

const routes: Routes = [
  { path: '', component: Schools },
  { path: 'users', component: Users },
  { path: 'schedule', component: Schedule },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
