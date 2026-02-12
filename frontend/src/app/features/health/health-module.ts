import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { ActiveSearch } from './pages/active-search/active-search';
import { Dashboards } from './pages/dashboards/dashboards';
import { HealthRoutingModule } from './health-routing-module';

@NgModule({
  declarations: [ActiveSearch, Dashboards],
  imports: [SharedModule, HealthRoutingModule],
})
export class HealthModule {}
