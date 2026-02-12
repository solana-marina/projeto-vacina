import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { AdminRoutingModule } from './admin-routing-module';
import { Schedule } from './pages/schedule/schedule';
import { Schools } from './pages/schools/schools';
import { Users } from './pages/users/users';

@NgModule({
  declarations: [Schools, Users, Schedule],
  imports: [SharedModule, AdminRoutingModule],
})
export class AdminModule {}
