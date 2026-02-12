import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ActiveSearch } from './pages/active-search/active-search';
import { Dashboards } from './pages/dashboards/dashboards';

const routes: Routes = [
  { path: '', component: ActiveSearch },
  { path: 'dashboards', component: Dashboards },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HealthRoutingModule {}
